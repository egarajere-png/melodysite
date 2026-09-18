import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(155deg, #2f1a45 0%, #241338 55%, #170b24 100%)",
          color: "#F7F1E8",
        }}
      >
        <div style={{ fontSize: 72, letterSpacing: 12, fontFamily: "serif" }}>AURUM ENTONET</div>
        <div style={{ marginTop: 24, fontSize: 26, letterSpacing: 4, color: "#D8C5E8", display: "flex" }}>
          A HANDMADE STORY IN KENYA
        </div>
      </div>
    ),
    { ...size }
  );
}
