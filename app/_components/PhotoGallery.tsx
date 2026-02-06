// app/_components/PhotoGallery.tsx
import { useMemo, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import ImageViewing from "react-native-image-viewing";

type PhotoItem = { uri: string };

export function PhotoGallery({
  photos,
  onPressAdd,
  onRemoveAt,
  mainAspectRatio = 1,
}: {
  photos: PhotoItem[];
  onPressAdd?: () => void;
  onRemoveAt?: (index: number) => void;
  mainAspectRatio?: number; // 1=正方形, 16/9 など
}) {
  const hasPhotos = photos && photos.length > 0;

  const screenW = Dimensions.get("window").width;
  const mainW = useMemo(() => screenW - 32, [screenW]); // 画面左右padding 16想定
  const mainH = useMemo(
    () => Math.max(220, Math.round(mainW / (mainAspectRatio || 1))),
    [mainW, mainAspectRatio]
  );

  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAt = (i: number) => {
    setActiveIndex(i);
    setViewerVisible(true);
  };

  const close = () => setViewerVisible(false);

  const canRemove = typeof onRemoveAt === "function";
  const canAdd = typeof onPressAdd === "function";

  const thumbSize = 78;

  const viewerImages = useMemo(
    () => (photos ?? []).map((p) => ({ uri: p.uri })).filter((x) => !!x.uri),
    [photos]
  );

  return (
    <View style={{ marginBottom: 8 }}>
      {hasPhotos ? (
        <Pressable
          onPress={() => openAt(activeIndex)}
          style={{
            width: mainW,
            height: mainH,
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: "#f2f2f2",
          }}
        >
          <Image
            source={{ uri: photos[activeIndex]?.uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </Pressable>
      ) : (
        <View
          style={{
            width: mainW,
            height: mainH,
            borderRadius: 18,
            backgroundColor: "#f2f2f2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#666", fontWeight: "800" }}>
            まだ写真はありません
          </Text>

          {canAdd ? (
            <Pressable
              onPress={onPressAdd}
              style={{
                marginTop: 12,
                backgroundColor: "#111",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                ＋ 写真を追加
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ gap: 10 }}
      >
        {photos.map((p, idx) => {
          const isActive = idx === activeIndex;

          return (
            <Pressable
              key={`${p.uri}_${idx}`}
              onPress={() => setActiveIndex(idx)}
              onLongPress={() => openAt(idx)}
              style={{
                width: thumbSize,
                height: thumbSize,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: "#f2f2f2",
                borderWidth: isActive ? 2 : 0,
                borderColor: isActive ? "#ff8a3d" : "transparent",
              }}
            >
              <Image
                source={{ uri: p.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />

              {canRemove ? (
                <Pressable
                  onPress={() => onRemoveAt?.(idx)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "rgba(0,0,0,0.75)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>×</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}

        {canAdd ? (
          <Pressable
            onPress={onPressAdd}
            style={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: 14,
              backgroundColor: "#111",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
              ＋
            </Text>
            <Text style={{ color: "#fff", marginTop: 4, fontSize: 11 }}>
              追加
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ImageViewing
        images={viewerImages}
        imageIndex={activeIndex}
        visible={viewerVisible}
        onRequestClose={close}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        HeaderComponent={() => (
          <View
            style={{
              paddingTop: 54,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {viewerImages.length > 0
                ? `${activeIndex + 1} / ${viewerImages.length}`
                : ""}
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {canRemove && viewerImages.length > 0 ? (
                <Pressable
                  onPress={() => {
                    const idx = activeIndex;
                    onRemoveAt?.(idx);
                    close();
                  }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>削除</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={close}
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>閉じる</Text>
              </Pressable>
            </View>
          </View>
        )}
        onImageIndexChange={(i) => setActiveIndex(i)}
      />
    </View>
  );
}

export default PhotoGallery;
