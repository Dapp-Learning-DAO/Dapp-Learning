# Declare this file as a StarkNet contract and set the required
# builtins.
%lang starknet
%builtins pedersen range_check ecdsa

from starkware.cairo.common.cairo_builtins import (
    HashBuiltin, SignatureBuiltin)
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import (
    verify_ecdsa_signature)
from starkware.starknet.common.syscalls import get_tx_signature

@constructor
func constructor{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr
} (lucky_user : felt, initial_balance : felt):
    balance.write(lucky_user, initial_balance)
    return ()
end

# Define a storage variable.
@storage_var
func balance(user : felt) -> (res : felt):
end

# Increases the balance of the given user by the given amount.
@external
func increase_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, ecdsa_ptr : SignatureBuiltin*}(
        user : felt, amount : felt):
    # Fetch the signature.
    let (sig_len : felt, sig : felt*) = get_tx_signature()

    # Verify the signature length.
    assert sig_len = 2

    # Compute the hash of the message.
    # The hash of (x, 0) is equivalent to the hash of (x).
    let (amount_hash) = hash2{hash_ptr=pedersen_ptr}(amount, 0)

    # Verify the user's signature.
    verify_ecdsa_signature(
        message=amount_hash,
        public_key=user,
        signature_r=sig[0],
        signature_s=sig[1])

    let (res) = balance.read(user=user)
    balance.write(user, res + amount)
    return ()
end

# Returns the balance of the given user.
@view
func get_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}(user : felt) -> (res : felt):
    let (res) = balance.read(user=user)
    return (res)
end
