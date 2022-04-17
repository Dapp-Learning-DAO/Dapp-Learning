# Declare this file as a StarkNet contract and set the required
# builtins.
%lang starknet
%builtins pedersen range_check

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_tx_signature
from starkware.cairo.common.math import unsigned_div_rem
from util import almost_equal as aeq

# Define a storage variable.
@storage_var
func balance() -> (res : felt):
end

@constructor
func constructor{
    syscall_ptr : felt*,
    pedersen_ptr : HashBuiltin*,
    range_check_ptr
} (initial_balance : felt):
    balance.write(initial_balance)
    return ()
end

# Increases the balance by the given amount.
@external
func increase_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}(amount1 : felt, amount2 : felt):
    let (res) = balance.read()
    balance.write(res + amount1 + amount2)
    return ()
end

@view
func increase_balance_with_even{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*,
    range_check_ptr}(amount: felt):

    let (div, rem) = unsigned_div_rem(amount, 2)
    assert rem = 0 # assert even
    let (res) = balance.read()
    balance.write(res + amount)
    return ()
end

# Returns the current balance.
@view
func get_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}() -> (res : felt):
    let (res) = balance.read()
    return (res)
end

############ tuples

struct Point:
    member x : felt
    member y : felt
end

struct PointPair:
    member p1 : Point
    member p2 : Point
    member extra : felt
end

struct TupleHolder:
    member tuple : (felt, felt)
    member extra : felt
end

@view
func dummy_tuple_holder() -> (tuple_holder: TupleHolder):
    return (
        tuple_holder=TupleHolder(
            tuple=(2, 3),
            extra=4
        )
    )
end

@view
func identity(a_len: felt, a: felt*) -> (res_len: felt, res: felt*, res_len_squared: felt):
    return(
        res_len=a_len,
        res=a,
        res_len_squared=a_len * a_len
    )
end

@view
func sum_points_to_tuple(points : (Point, Point)) -> (res: (felt, felt)):
    return (
        res=(
            points[0].x + points[1].x,
            points[0].y + points[1].y
        )
    )
end

@view
func sum_point_pair(pointPair: PointPair) -> (res: Point):
    return (
        res=Point(
            x=pointPair.p1.x + pointPair.p2.x + pointPair.extra,
            y=pointPair.p1.y + pointPair.p2.y + pointPair.extra
        )
    )
end

@view
func add_extra_to_tuple(tuple_holder: TupleHolder) -> (res: Point):
    return (
        res=Point(
            x=tuple_holder.tuple[0] + tuple_holder.extra,
            y=tuple_holder.tuple[1] + tuple_holder.extra
        )
    )
end

@view
func use_almost_equal(a, b) -> (res):
    let (res) = aeq(a=a, b=b)
    return (res)
end

########### arrays

@external
func sum_array(
        a_len : felt, a : felt*) -> (res):
    if a_len == 0:
        return (res=0)
    end
    let (rest) = sum_array(a_len=a_len - 1, a=a + 1)
    return (res=a[0] + rest)
end

@external
func get_signature{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*}() -> (
        res_len : felt, res : felt*):
    let (sig_len, sig) = get_tx_signature()
    return (res_len=sig_len, res=sig)
end
