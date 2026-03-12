type AlertStatusProps = {
  feedbackType: "success" | "error";
  feedbackMessage: string;
  onClose: () => void;
};

export default function AlertStatus({
  feedbackType,
  feedbackMessage,
  onClose,
}: AlertStatusProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111214] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col items-center text-center">
          <div
            className={[
              "flex h-20 w-20 items-center justify-center rounded-full border text-4xl",
              feedbackType === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400",
            ].join(" ")}
          >
            {feedbackType === "success" ? "✅" : "⚠️"}
          </div>

          <h3 className="mt-5 text-2xl font-black uppercase tracking-[0.08em] text-white">
            {feedbackType === "success" ? "Alerta enviada" : "Error al enviar"}
          </h3>

          <p className="mt-3 text-sm leading-6 text-white/60">
            {feedbackMessage}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={[
              "mt-6 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-[0.12em] text-white transition",
              feedbackType === "success"
                ? "bg-emerald-500 hover:brightness-110"
                : "bg-red-500 hover:brightness-110",
            ].join(" ")}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}