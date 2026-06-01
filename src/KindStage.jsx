import { MONO, MUTED, STAGE, KIND_COLOR } from "./styles";

export default function KindStage({ p }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10.5, color: MUTED }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: KIND_COLOR[p.kind] }} />
        {p.kind}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 9, background: STAGE[p.stage]?.dot ?? "#aaa" }} />
        {STAGE[p.stage]?.label ?? p.stage}
      </span>
    </span>
  );
}
