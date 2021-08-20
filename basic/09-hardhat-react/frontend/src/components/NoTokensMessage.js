import React from 'react'

export function NoTokensMessage({ deployContract }) {
  return (
    <>
      <p>You don't have tokens to transfer</p>
      <button
        className="btn btn-warning"
        type="button"
        onClick={deployContract}
      >
        Try to deploy a ERC20 contract, and get the initial tokens.
      </button>
    </>
  )
}
