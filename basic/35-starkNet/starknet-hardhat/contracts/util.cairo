func almost_equal(a, b) -> (res: felt):
    if (a - b) * (a - b - 1) * (a - b + 1) == 0:
        return (res=1)
    end
    return (res=0)
end
