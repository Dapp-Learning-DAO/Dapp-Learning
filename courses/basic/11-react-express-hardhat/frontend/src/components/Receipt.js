import React from "react";

export function Receipt({ receipt }) {
  console.log(receipt);
  return (
    <>
      <div className="alert alert-danger row" role="alert">
        <div class="row">
          <div class="col-sm">{receipt.pubDate}</div>
          <div class="col-sm">{receipt.from}</div>
          <div class="col-sm">{receipt.to}</div>
          <div class="col-sm">{receipt.transactionHash}</div>
        </div>
      </div>
    </>
  );
}
