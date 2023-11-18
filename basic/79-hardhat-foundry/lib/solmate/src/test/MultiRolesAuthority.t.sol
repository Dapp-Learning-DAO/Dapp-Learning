// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {MockAuthority} from "./utils/mocks/MockAuthority.sol";

import {Authority} from "../auth/Auth.sol";

import {MultiRolesAuthority} from "../auth/authorities/MultiRolesAuthority.sol";

contract MultiRolesAuthorityTest is DSTestPlus {
    MultiRolesAuthority multiRolesAuthority;

    function setUp() public {
        multiRolesAuthority = new MultiRolesAuthority(address(this), Authority(address(0)));
    }

    function testSetRoles() public {
        assertFalse(multiRolesAuthority.doesUserHaveRole(address(0xBEEF), 0));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertTrue(multiRolesAuthority.doesUserHaveRole(address(0xBEEF), 0));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertFalse(multiRolesAuthority.doesUserHaveRole(address(0xBEEF), 0));
    }

    function testSetRoleCapabilities() public {
        assertFalse(multiRolesAuthority.doesRoleHaveCapability(0, 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.doesRoleHaveCapability(0, 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, false);
        assertFalse(multiRolesAuthority.doesRoleHaveCapability(0, 0xBEEFCAFE));
    }

    function testSetPublicCapabilities() public {
        assertFalse(multiRolesAuthority.isCapabilityPublic(0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.isCapabilityPublic(0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, false);
        assertFalse(multiRolesAuthority.isCapabilityPublic(0xBEEFCAFE));
    }

    function testSetTargetCustomAuthority() public {
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(address(0xBEEF))), address(0));

        multiRolesAuthority.setTargetCustomAuthority(address(0xBEEF), Authority(address(0xCAFE)));
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(address(0xBEEF))), address(0xCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xBEEF), Authority(address(0)));
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(address(0xBEEF))), address(0));
    }

    function testCanCallWithAuthorizedRole() public {
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, false);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallPublicCapability() public {
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, false);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallWithCustomAuthority() public {
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallWithCustomAuthorityOverridesPublicCapability() public {
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, false);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setPublicCapability(0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testCanCallWithCustomAuthorityOverridesUserWithRole() public {
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setTargetCustomAuthority(address(0xCAFE), Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, true);
        assertTrue(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setRoleCapability(0, 0xBEEFCAFE, false);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));

        multiRolesAuthority.setUserRole(address(0xBEEF), 0, false);
        assertFalse(multiRolesAuthority.canCall(address(0xBEEF), address(0xCAFE), 0xBEEFCAFE));
    }

    function testSetRoles(address user, uint8 role) public {
        assertFalse(multiRolesAuthority.doesUserHaveRole(user, role));

        multiRolesAuthority.setUserRole(user, role, true);
        assertTrue(multiRolesAuthority.doesUserHaveRole(user, role));

        multiRolesAuthority.setUserRole(user, role, false);
        assertFalse(multiRolesAuthority.doesUserHaveRole(user, role));
    }

    function testSetRoleCapabilities(uint8 role, bytes4 functionSig) public {
        assertFalse(multiRolesAuthority.doesRoleHaveCapability(role, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, true);
        assertTrue(multiRolesAuthority.doesRoleHaveCapability(role, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, false);
        assertFalse(multiRolesAuthority.doesRoleHaveCapability(role, functionSig));
    }

    function testSetPublicCapabilities(bytes4 functionSig) public {
        assertFalse(multiRolesAuthority.isCapabilityPublic(functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, true);
        assertTrue(multiRolesAuthority.isCapabilityPublic(functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, false);
        assertFalse(multiRolesAuthority.isCapabilityPublic(functionSig));
    }

    function testSetTargetCustomAuthority(address user, Authority customAuthority) public {
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(user)), address(0));

        multiRolesAuthority.setTargetCustomAuthority(user, customAuthority);
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(user)), address(customAuthority));

        multiRolesAuthority.setTargetCustomAuthority(user, Authority(address(0)));
        assertEq(address(multiRolesAuthority.getTargetCustomAuthority(user)), address(0));
    }

    function testCanCallWithAuthorizedRole(
        address user,
        uint8 role,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, true);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, false);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, false);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));
    }

    function testCanCallPublicCapability(
        address user,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, false);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));
    }

    function testCanCallWithCustomAuthority(
        address user,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));
    }

    function testCanCallWithCustomAuthorityOverridesPublicCapability(
        address user,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, false);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setPublicCapability(functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));
    }

    function testCanCallWithCustomAuthorityOverridesUserWithRole(
        address user,
        uint8 role,
        address target,
        bytes4 functionSig
    ) public {
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, true);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(false));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, new MockAuthority(true));
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, false);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setTargetCustomAuthority(target, Authority(address(0)));
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, true);
        assertTrue(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setRoleCapability(role, functionSig, false);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));

        multiRolesAuthority.setUserRole(user, role, false);
        assertFalse(multiRolesAuthority.canCall(user, target, functionSig));
    }
}
