import { Img, staticFile } from "remotion";

type BrowserFrameProps = {
  src: string;
  title?: string;
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  src,
  title = "TrueRisk",
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 1600,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Mac-style title bar */}
        <div
          style={{
            backgroundColor: "#1C1C1E",
            height: 40,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            paddingRight: 16,
            gap: 8,
            borderBottom: "1px solid #2A2A2E",
          }}
        >
          {/* Traffic lights */}
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840" }} />
          {/* Title */}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Geist Sans",
              fontSize: 13,
              fontWeight: 400,
              color: "#888888",
              letterSpacing: 0.3,
            }}
          >
            {title}
          </div>
          {/* Spacer for symmetry */}
          <div style={{ width: 52 }} />
        </div>

        {/* Screenshot content */}
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
