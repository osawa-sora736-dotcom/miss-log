// lib/db.ts
import * as SQLite from "expo-sqlite";

/**
 * DBはexportしておくと、calendar画面や集計で直接使いたい時に便利
 */
export const db = SQLite.openDatabaseSync("missnote.db");

export type MistakeRow = {
  id: number;
  title: string;
  body: string;
  subject: string;
  importance: number;
  occurred_at: string;

  // 一覧の1枚目プレビュー用（searchMistakesで付与）
  firstPhotoUri?: string | null;
};

export type MistakePhotoRow = {
  id: number;
  mistake_id: number;
  uri: string;
  created_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

/** PRAGMA table_info で列一覧 */
function getColumns(tableName: string): string[] {
  const rows = db.getAllSync<{ name: string }>(
    `PRAGMA table_info(${tableName});`
  );
  return rows.map((r) => r.name);
}

/**
 * DB初期化 + 既存DBの自動マイグレーション
 * - 既存データは保持
 * - 足りない列を ALTER TABLE で追加
 */
export function initDb() {
  db.execSync("PRAGMA foreign_keys = ON;");

  // ====== mistakes ======
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,

      subject TEXT NOT NULL DEFAULT '英語',
      importance INTEGER NOT NULL DEFAULT 2,

      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // ====== subjects ======
  db.execSync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // ====== 初期科目投入：INSERT OR IGNORE で将来の追加にも強く ======
  // 既にある科目は無視されるので、安全に“足し”できる
  const defaults = ["国語", "数学", "英語", "物理", "化学"];
  const stmt = db.prepareSync(
    `INSERT OR IGNORE INTO subjects (name, sort_order, is_active) VALUES (?, ?, 1);`
  );
  try {
    defaults.forEach((name, i) => stmt.executeSync([name, i]));
  } finally {
    stmt.finalizeSync();
  }

  // subjects があるのに mistakes.subject が空の古データがある場合の保険
  db.runSync(
    `
    UPDATE mistakes
    SET subject = '英語'
    WHERE subject IS NULL OR subject = '';
  `
  );

  // ====== mistake_photos（写真） ======
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mistake_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mistake_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mistake_id) REFERENCES mistakes(id) ON DELETE CASCADE
    );
  `);

  // ====== mistakes のマイグレーション ======
  const cols = getColumns("mistakes");

  // created_at
  if (!cols.includes("created_at")) {
    db.execSync(`ALTER TABLE mistakes ADD COLUMN created_at TEXT;`);
    const t = nowIso();
    db.runSync(
      `UPDATE mistakes SET created_at = ? WHERE created_at IS NULL OR created_at = '';`,
      [t]
    );
  }

  // importance
  if (!cols.includes("importance")) {
    db.execSync(
      `ALTER TABLE mistakes ADD COLUMN importance INTEGER NOT NULL DEFAULT 2;`
    );
    db.runSync(`UPDATE mistakes SET importance = 2 WHERE importance IS NULL;`);
  }

  // subject
  if (!cols.includes("subject")) {
    db.execSync(
      `ALTER TABLE mistakes ADD COLUMN subject TEXT NOT NULL DEFAULT '英語';`
    );
    db.runSync(
      `UPDATE mistakes SET subject = '英語' WHERE subject IS NULL OR subject = '';`
    );
  }

  // occurred_at（無い古いDBには created_at を流用）
  {
    const t = nowIso();

    if (!cols.includes("occurred_at")) {
      db.execSync(`ALTER TABLE mistakes ADD COLUMN occurred_at TEXT;`);
      db.runSync(
        `
        UPDATE mistakes
        SET occurred_at = CASE
          WHEN created_at IS NOT NULL AND created_at <> '' THEN created_at
          ELSE ?
        END
        WHERE occurred_at IS NULL OR occurred_at = '';
      `,
        [t]
      );
    } else {
      db.runSync(
        `
        UPDATE mistakes
        SET occurred_at = CASE
          WHEN created_at IS NOT NULL AND created_at <> '' THEN created_at
          ELSE ?
        END
        WHERE occurred_at IS NULL OR occurred_at = '';
      `,
        [t]
      );
    }
  }

  // updated_at（無い古いDBには created_at を流用）
  {
    const t = nowIso();

    if (!cols.includes("updated_at")) {
      db.execSync(`ALTER TABLE mistakes ADD COLUMN updated_at TEXT;`);
      db.runSync(
        `
        UPDATE mistakes
        SET updated_at = CASE
          WHEN created_at IS NOT NULL AND created_at <> '' THEN created_at
          ELSE ?
        END
        WHERE updated_at IS NULL OR updated_at = '';
      `,
        [t]
      );
    } else {
      db.runSync(
        `
        UPDATE mistakes
        SET updated_at = CASE
          WHEN created_at IS NOT NULL AND created_at <> '' THEN created_at
          ELSE ?
        END
        WHERE updated_at IS NULL OR updated_at = '';
      `,
        [t]
      );
    }
  }

  // body が無い設計を作っていた可能性への保険（基本いらないが事故回避）
  if (!cols.includes("body")) {
    // もし本当に無いDBなら致命的に違うので、本来はここでエラーにした方が早い
  }
}

/** ====== Insert ====== */
/**
 * insertしたidを返す（写真テーブルと紐づけるため）
 */
export async function insertMistake(params: {
  title: string;
  body: string;
  subject: string; // Pickerの値をそのまま
  importance: number; // 1..3
  occurred_at: string; // ISO
}): Promise<number> {
  const created_at = nowIso();
  const updated_at = created_at;

  const stmt = db.prepareSync(
    `INSERT INTO mistakes (title, body, subject, importance, occurred_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`
  );

  try {
    const res = stmt.executeSync([
      params.title.trim(),
      params.body.trim(),
      params.subject,
      params.importance,
      params.occurred_at,
      created_at,
      updated_at,
    ]);

    const id = Number((res as any)?.lastInsertRowId);
    return id;
  } finally {
    stmt.finalizeSync();
  }
}

/**
 * 1ミスに複数写真を紐づけてinsert
 */
export async function insertMistakePhotos(
  mistakeId: number,
  uris: string[]
): Promise<void> {
  if (!uris.length) return;
  const created_at = nowIso();

  const stmt = db.prepareSync(
    `INSERT INTO mistake_photos (mistake_id, uri, created_at) VALUES (?, ?, ?);`
  );

  try {
    uris.forEach((uri) => {
      stmt.executeSync([mistakeId, uri, created_at]);
    });
  } finally {
    stmt.finalizeSync();
  }
}

/** ====== Photos ====== */
export function getPhotosByMistakeId(mistakeId: number): MistakePhotoRow[] {
  return db.getAllSync<MistakePhotoRow>(
    `SELECT id, mistake_id, uri, created_at
     FROM mistake_photos
     WHERE mistake_id = ?
     ORDER BY id ASC;`,
    [mistakeId]
  );
}

export function deleteMistakePhoto(photoId: number) {
  db.runSync(`DELETE FROM mistake_photos WHERE id = ?;`, [photoId]);
}

/** ====== List (default) ====== */
/** デフォ：重要度 高→低、発生日時 新→旧 */
export function getAllMistakes(): MistakeRow[] {
  return db.getAllSync<MistakeRow>(`
    SELECT id, title, body, subject, importance, occurred_at, created_at, updated_at
    FROM mistakes
    ORDER BY importance DESC, occurred_at DESC;
  `);
}

/** ======= Search / Filter / Sort ======= */
export function searchMistakes(params: {
  from?: string; // ISO
  to?: string; // ISO（exclusive推奨）
  q?: string; // 部分一致（日本語OK）
  subject?: string; // "ALL" or undefined なら全件
  importance?: number; // 0 or undefined なら全件
  sort?: "importance" | "date" | "subject" | "review";
}): MistakeRow[] {
  const q = (params.q ?? "").trim();
  const where: string[] = [];
  const args: any[] = [];

  // 検索（タイトル/内容）
  if (q) {
    where.push("(m.title LIKE ? OR m.body LIKE ?)");
    args.push(`%${q}%`, `%${q}%`);
  }

  // 科目
  if (params.subject && params.subject !== "ALL") {
    where.push("m.subject = ?");
    args.push(params.subject);
  }

  // 重要度（0/undefinedは全件）
  if (params.importance && params.importance !== 0) {
    where.push("m.importance = ?");
    args.push(params.importance);
  }

  // 日付範囲（復習用）
  if (params.from) {
    where.push("m.occurred_at >= ?");
    args.push(params.from);
  }
  if (params.to) {
    where.push("m.occurred_at < ?");
    args.push(params.to);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql =
    params.sort === "review"
      ? "ORDER BY m.importance DESC, m.occurred_at ASC"
      : params.sort === "importance"
      ? "ORDER BY m.importance DESC, m.occurred_at DESC"
      : params.sort === "subject"
      ? "ORDER BY m.subject ASC, m.occurred_at DESC"
      : "ORDER BY m.occurred_at DESC";

  // ★ firstPhotoUri をサブクエリで付与（一覧プレビュー用）
  const sql = `
    SELECT
      m.*,
      (
        SELECT p.uri
        FROM mistake_photos p
        WHERE p.mistake_id = m.id
        ORDER BY p.id ASC
        LIMIT 1
      ) AS firstPhotoUri
    FROM mistakes m
    ${whereSql}
    ${orderSql}
  `;

  return (db.getAllSync(sql, args) as any) as MistakeRow[];
}

/** ====== Detail ====== */
export function getMistakeById(id: number): MistakeRow | null {
  const row = db.getFirstSync<MistakeRow>(
    `SELECT id, title, body, subject, importance, occurred_at, created_at, updated_at
     FROM mistakes
     WHERE id = ?`,
    [id]
  );
  return row ?? null;
}

/** ====== Update ====== */
export function updateMistake(params: {
  id: number;
  title: string;
  body: string;
  subject: string;
  importance: number;
  occurred_at: string; // ISO
}) {
  const updated_at = nowIso();

  db.runSync(
    `UPDATE mistakes
     SET title = ?, body = ?, subject = ?, importance = ?, occurred_at = ?, updated_at = ?
     WHERE id = ?`,
    [
      params.title.trim(),
      params.body.trim(),
      params.subject,
      params.importance,
      params.occurred_at,
      updated_at,
      params.id,
    ]
  );
}

/** ====== Delete ====== */
export function deleteMistake(id: number) {
  db.runSync(`DELETE FROM mistakes WHERE id = ?`, [id]);
}

/** ====== Subjects (user editable) ====== */
export type SubjectRow = {
  id: number;
  name: string;
  sort_order: number;
  is_active: number; // 1/0
};

export function getSubjects(): string[] {
  const rows = db.getAllSync<SubjectRow>(`
    SELECT id, name, sort_order, is_active
    FROM subjects
    WHERE is_active = 1
    ORDER BY sort_order ASC, id ASC;
  `);
  return rows.map((r) => r.name);
}

export function addSubject(name: string) {
  const n = name.trim();
  if (!n) throw new Error("empty");

  const exist = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c FROM subjects WHERE name = ? AND is_active = 1;`,
    [n]
  );
  if ((exist?.c ?? 0) > 0) throw new Error("duplicate");

  const mx = db.getFirstSync<{ mx: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) as mx FROM subjects;`
  );
  const next = (mx?.mx ?? 0) + 1;

  db.runSync(
    `INSERT INTO subjects (name, sort_order, is_active) VALUES (?, ?, 1);`,
    [n, next]
  );
}

export function renameSubject(oldName: string, newName: string) {
  const o = oldName.trim();
  const n = newName.trim();
  if (!o || !n) throw new Error("empty");
  if (o === n) return;

  const exist = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c FROM subjects WHERE name = ? AND is_active = 1;`,
    [n]
  );
  if ((exist?.c ?? 0) > 0) throw new Error("duplicate");

  db.runSync(`UPDATE subjects SET name = ? WHERE name = ?;`, [n, o]);

  // ★ここが「一覧にも反映」の本体：過去mistakesも全部置換
  db.runSync(`UPDATE mistakes SET subject = ? WHERE subject = ?;`, [n, o]);
}

export function deleteSubject(name: string) {
  const n = name.trim();
  if (!n) throw new Error("empty");

  const used = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c FROM mistakes WHERE subject = ?;`,
    [n]
  );
  if ((used?.c ?? 0) > 0) throw new Error("in_use");

  db.runSync(`UPDATE subjects SET is_active = 0 WHERE name = ?;`, [n]);
}

/** ====== Backup / Restore (ZIP) ====== */

// バックアップ用の“完全データ”
export function exportAllDataForBackup() {
  const mistakes = db.getAllSync<any>(`
    SELECT id, title, body, subject, importance, occurred_at, created_at, updated_at
    FROM mistakes
    ORDER BY id ASC;
  `);

  const mistake_photos = db.getAllSync<any>(`
    SELECT id, mistake_id, uri, created_at
    FROM mistake_photos
    ORDER BY id ASC;
  `);

  const subjects = db.getAllSync<any>(`
    SELECT id, name, sort_order, is_active
    FROM subjects
    ORDER BY id ASC;
  `);

  return { mistakes, mistake_photos, subjects };
}

/**
 * 復元のために全削除
 * 外部キーの順序が大事：photos → mistakes → subjects
 */
export function clearAllDataForRestore() {
  db.execSync("PRAGMA foreign_keys = OFF;");
  try {
    db.execSync("BEGIN;");
    db.execSync(`DELETE FROM mistake_photos;`);
    db.execSync(`DELETE FROM mistakes;`);
    db.execSync(`DELETE FROM subjects;`);
    db.execSync("COMMIT;");
  } catch (e) {
    db.execSync("ROLLBACK;");
    throw e;
  } finally {
    db.execSync("PRAGMA foreign_keys = ON;");
  }
}

/**
 * JSONから一括INSERT（ID維持）
 */
export function importAllDataFromBackup(payload: {
  mistakes: any[];
  mistake_photos: any[];
  subjects: any[];
}) {
  db.execSync("PRAGMA foreign_keys = OFF;");
  try {
    db.execSync("BEGIN;");

    // subjects
    const sStmt = db.prepareSync(
      `INSERT INTO subjects (id, name, sort_order, is_active) VALUES (?, ?, ?, ?);`
    );
    try {
      for (const s of payload.subjects ?? []) {
        sStmt.executeSync([
          Number(s.id),
          String(s.name ?? ""),
          Number(s.sort_order ?? 0),
          Number(s.is_active ?? 1),
        ]);
      }
    } finally {
      sStmt.finalizeSync();
    }

    // mistakes
    const mStmt = db.prepareSync(
      `INSERT INTO mistakes (id, title, body, subject, importance, occurred_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
    );
    try {
      for (const m of payload.mistakes ?? []) {
        mStmt.executeSync([
          Number(m.id),
          String(m.title ?? "").trim(),
          String(m.body ?? "").trim(),
          String(m.subject ?? "英語"),
          Number(m.importance ?? 2),
          String(m.occurred_at ?? nowIso()),
          String(m.created_at ?? nowIso()),
          String(m.updated_at ?? nowIso()),
        ]);
      }
    } finally {
      mStmt.finalizeSync();
    }

    // mistake_photos
    const pStmt = db.prepareSync(
      `INSERT INTO mistake_photos (id, mistake_id, uri, created_at)
       VALUES (?, ?, ?, ?);`
    );
    try {
      for (const p of payload.mistake_photos ?? []) {
        pStmt.executeSync([
          Number(p.id),
          Number(p.mistake_id),
          String(p.uri ?? ""),
          String(p.created_at ?? nowIso()),
        ]);
      }
    } finally {
      pStmt.finalizeSync();
    }

    db.execSync("COMMIT;");
  } catch (e) {
    db.execSync("ROLLBACK;");
    throw e;
  } finally {
    db.execSync("PRAGMA foreign_keys = ON;");
  }
}

/**
 * 復元後：mistake_photos.uri を “この端末の photosDir + ファイル名” に揃える
 * 例）旧uri: file:///.../mistake-photos/abc.jpg
 *     新uri: {photosDir}/abc.jpg
 */
export function normalizePhotoUris(photosDir: string) {
  const rows = db.getAllSync<{ id: number; uri: string }>(
    `SELECT id, uri FROM mistake_photos ORDER BY id ASC;`
  );

  const upd = db.prepareSync(`UPDATE mistake_photos SET uri = ? WHERE id = ?;`);
  try {
    for (const r of rows) {
      const uri = r.uri ?? "";
      const fileName = uri.split("/").pop()?.split("\\").pop() ?? "";
      if (!fileName) continue;
      const normalized = `${photosDir}${fileName}`;
      upd.executeSync([normalized, r.id]);
    }
  } finally {
    upd.finalizeSync();
  }
}
