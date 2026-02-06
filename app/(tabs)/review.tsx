import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MistakeRow, searchMistakes } from "../../lib/db";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
};

const importanceMeta = (v: number) => {
  if (v === 3) return { label: "High", bg: "#ff4d4f" };
  if (v === 2) return { label: "Mid", bg: "#ff8a3d" };
  return { label: "Low", bg: "#9aa0a6" };
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

type RangeSpec = { title: string; desc?: string; from: string; to: string };

function makeRanges(now = new Date()): {
  yesterday: RangeSpec;
  weekAgo: RangeSpec;
  monthAgo: RangeSpec;
} {
  const today0 = startOfDay(now);

  // 昨日：昨日1日分
  const yFrom = addDays(today0, -1);
  const yTo = addDays(today0, 0);

  // 1週間前：8〜6日前（= 8,7,6日前の3日） => [today-8, today-5)
  const wFrom = addDays(today0, -8);
  const wTo = addDays(today0, -5);

  // 1か月前：33日前〜29日前（= 33,32,31,30,29日前の5日） => [today-33, today-28)
  const mFrom = addDays(today0, -33);
  const mTo = addDays(today0, -28);

  return {
    yesterday: {
      title: "昨日のミス",
      desc: undefined, // ← サブ文なし
      from: yFrom.toISOString(),
      to: yTo.toISOString(),
    },
    weekAgo: {
      title: "１週間前のミス",
      desc: "8〜6日前",
      from: wFrom.toISOString(),
      to: wTo.toISOString(),
    },
    monthAgo: {
      title: "１か月前のミス",
      desc: "33日前〜29日前",
      from: mFrom.toISOString(),
      to: mTo.toISOString(),
    },
  };
}

function Section({
  spec,
  rows,
  expanded,
  onToggle,
}: {
  spec: RangeSpec;
  rows: MistakeRow[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const show = expanded ? rows : rows.slice(0, 1);

  return (
    <View
      style={{
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 16,
        padding: 12,
        backgroundColor: "#fff",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: spec.desc ? "flex-end" : "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            {spec.title}
          </Text>

          {spec.desc ? (
            <Text style={{ marginTop: 2, fontSize: 12, color: "#777" }}>
              {spec.desc}
            </Text>
          ) : null}
        </View>

        {rows.length > 1 ? (
          <Pressable
            onPress={onToggle}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: "#f2f2f2",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111" }}>
              {expanded ? "閉じる" : "さらに見る"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <Text style={{ opacity: 0.6, marginTop: 12 }}>
          該当するミスはありません。
        </Text>
      ) : (
        <View style={{ marginTop: 10 }}>
          {show.map((r) => {
            const meta = importanceMeta(r.importance);

            return (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({
                    pathname: "/mistake/[id]",
                    params: { id: String(r.id) },
                  } as any)
                }
                style={{
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#f0f0f0",
                }}
              >
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {r.firstPhotoUri ? (
                    <Image
                      source={{ uri: r.firstPhotoUri }}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        backgroundColor: "#f2f2f2",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        backgroundColor: "#f2f2f2",
                      }}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: meta.bg,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          marginRight: 10,
                        }}
                      >
                        <Text
                          style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}
                        >
                          {meta.label}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          flexShrink: 1,
                          color: "#111",
                        }}
                        numberOfLines={1}
                      >
                        {r.title}
                      </Text>
                    </View>

                    <Text style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                      {r.subject || "（未設定）"}
                    </Text>

                    <Text
                      style={{ marginTop: 4, fontSize: 14, color: "#444" }}
                      numberOfLines={2}
                    >
                      {r.body}
                    </Text>

                    <Text style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
                      {formatDate(r.occurred_at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ReviewScreen() {
  const ranges = useMemo(() => makeRanges(new Date()), []);
  const [expanded, setExpanded] = useState<{ y: boolean; w: boolean; m: boolean }>({
    y: false,
    w: false,
    m: false,
  });

  const [yRows, setYRows] = useState<MistakeRow[]>([]);
  const [wRows, setWRows] = useState<MistakeRow[]>([]);
  const [mRows, setMRows] = useState<MistakeRow[]>([]);

  const load = useCallback(() => {
    // sort:"review" ＝ importance DESC → occurred_at ASC
    setYRows(
      searchMistakes({
        from: ranges.yesterday.from,
        to: ranges.yesterday.to,
        sort: "review",
      })
    );

    setWRows(
      searchMistakes({
        from: ranges.weekAgo.from,
        to: ranges.weekAgo.to,
        sort: "review",
      })
    );

    setMRows(
      searchMistakes({
        from: ranges.monthAgo.from,
        to: ranges.monthAgo.to,
        sort: "review",
      })
    );
  }, [ranges]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
       
        <Text style={{ marginTop: 4, fontSize: 12, color: "#777" }}>
          ミス度が高い順（同じなら古い順）で表示します。
        </Text>

        <Section
          spec={ranges.yesterday}
          rows={yRows}
          expanded={expanded.y}
          onToggle={() => setExpanded((p) => ({ ...p, y: !p.y }))}
        />

        <Section
          spec={ranges.weekAgo}
          rows={wRows}
          expanded={expanded.w}
          onToggle={() => setExpanded((p) => ({ ...p, w: !p.w }))}
        />

        <Section
          spec={ranges.monthAgo}
          rows={mRows}
          expanded={expanded.m}
          onToggle={() => setExpanded((p) => ({ ...p, m: !p.m }))}
        />
      </ScrollView>
    </View>
  );
}
