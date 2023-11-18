// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {Authority} from "../../../auth/Auth.sol";

contract MockAuthority is Authority {
    bool immutable allowCalls;

    constructor(bool _allowCalls) {
        allowCalls = _allowCalls;
    }

    function canCall(
        address,
        address,
        bytes4
    ) public view override returns (bool) {
        return allowCalls;
    }
}
