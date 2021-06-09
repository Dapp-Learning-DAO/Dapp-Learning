import React from "react";

export function WaitingForTransactionMessage({ txHash }) {
  return (
    <div className="alert alert-info" role="alert">
      Waiting for transaction <strong>{txHash}</strong> to be mined
    </div>
  );
}
