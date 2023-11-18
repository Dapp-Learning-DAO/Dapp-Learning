// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {MockAuthority} from "./utils/mocks/MockAuthority.sol";

import {Authority} from "../auth/Auth.sol";

import {RolesAuthority} from "../auth/authorities/RolesAuthority.sol";

contract RolesAuthorityTest is DSTestPlus {
    RolesAuthority rolesAuthority;

    function setUp() public {
        rolesAuthority = new RolesAuthority(address(this), Authority(address(0)));
    }

    function testSetRoles() public {
        assertFalse(rolesAuthority.doesUserHaveRole(address(0xBEEF), 0));

        rolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertTrue(rolesAuthority.doesUserHaveRole(address(0xBEEF), 0));

        rolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertFalse(rolesAuthority.doesUserHaveRole(address(0xBEEF), 0));
    }

    function testSetRoleCapabilities() public {
        assertFalse(rolesAuthority.doesRoleHaveCapability(0, address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setRoleCapability(0, address(0xCAFE), 0xBEEFCAFE, true);
        assertTrue(rolesAuthority.doesRoleHaveCapability(0, address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setRoleCapability(0, address(0xCAFE), 0xBEEFCAFE, false);
        assertFalse(rolesAuthority.doesRoleHaveCapability(0, address(0xCAFE), 0xBEEFCAFE));
    }

    function testSetPublicCapabilities() public {
        assertFalse(rolesAuthority.isCapabilityPublic(address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setPublicCapability(address(0xCAFE), 0xBEEFCAFE, true);
        assertTrue(rolesAuthority.isCapabilityPublic(address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setPublicCapability(address(0xCAFE), 0xBEEFCAFE, false);
        assertFalse(rolesAuthority.isCapabilityPublic(address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallWithAuthorizedRole() public {
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setRoleCapability(0, address(0xCAFE), 0xBEEFCAFE, true);
        assertTrue(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setRoleCapability(0, address(0xCAFE), 0xBEEFCAFE, false);
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setRoleCapability(0, address(0xCAFE), 0xBEEFCAFE, true);
        assertTrue(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallPublicCapability() public {
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setPublicCapability(address(0xCAFE), 0xBEEFCAFE, true);
        assertTrue(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        rolesAuthority.setPublicCapability(address(0xCAFE), 0xBEEFCAFE, false);
        assertFalse(rolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testSetRoles(address user, uint8 role) public {
        assertFalse(rolesAuthority.doesUserHaveRole(user, role));

        rolesAuthority.setUserRole(user, role, true);
        assertTrue(rolesAuthority.doesUserHaveRole(user, role));

        rolesAuthority.setUserRole(user, role, false);
        assertFalse(rolesAuthority.doesUserHaveRole(user, role));
    }

    function testSetRoleCapabilities(
        uint8 role,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(rolesAuthority.doesRoleHaveCapability(role, target, functionSig));

        rolesAuthority.setRoleCapability(role, target, functionSig, true);
        assertTrue(rolesAuthority.doesRoleHaveCapability(role, target, functionSig));

        rolesAuthority.setRoleCapability(role, target, functionSig, false);
        assertFalse(rolesAuthority.doesRoleHaveCapability(role, target, functionSig));
    }

    function testSetPublicCapabilities(address target, bytes4 functionSig) public {
        assertFalse(rolesAuthority.isCapabilityPublic(target, functionSig));

        rolesAuthority.setPublicCapability(target, functionSig, true);
        assertTrue(rolesAuthority.isCapabilityPublic(target, functionSig));

        rolesAuthority.setPublicCapability(target, functionSig, false);
        assertFalse(rolesAuthority.isCapabilityPublic(target, functionSig));
    }

    function testCanCallWithAuthorizedRole(
        address user,
        uint8 role,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setUserRole(user, role, true);
        assertFalse(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setRoleCapability(role, target, functionSig, true);
        assertTrue(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setRoleCapability(role, target, functionSig, false);
        assertFalse(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setRoleCapability(role, target, functionSig, true);
        assertTrue(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setUserRole(user, role, false);
        assertFalse(rolesAuthority.canCall(user, target, functionSig));
    }

    function testCanCallPublicCapability(
        address user,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setPublicCapability(target, functionSig, true);
        assertTrue(rolesAuthority.canCall(user, target, functionSig));

        rolesAuthority.setPublicCapability(target, functionSig, false);
        assertFalse(rolesAuthority.canCall(user, target, functionSig));
    }
}
