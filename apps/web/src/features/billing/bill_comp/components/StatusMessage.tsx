import type { BillingStatus } from "../types";

interface StatusMessageProps {
  status: BillingStatus;
}

export default function StatusMessage({ status }: StatusMessageProps) {
  const accountMessage =
    "Create an account on voiceai.signo.in to activate your plan.";

  return (
    <div className={`bp-status ${status.type}`} role="status">
      <span className="bp-status-dot" aria-hidden="true" />

      {status.message === accountMessage ? (
        <>
          <span>
            Create an account on <a
              href="https://voiceai.signo.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: "bold" }}
            >
              <>voiceai.signo.in</>
            </a> to activate your plan.
          </span>
        </>
      ) : (
        status.message
      )}
    </div>
  );
}
