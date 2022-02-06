// finds the popsicle bug
rule increase_total_value_without_actually_adding_assets() {
    // The rule checks that after 'transfer' function the total assets of the involved parties remain the same.
    // To check this rule of your project implement the assetsOf function that given address returns the total assets of this address.
    env e;
    address a;
    address b;
    uint amount;

    uint total_balance_before = assetsOf(e, a) + assetsOf(e, b);
    transferFrom(e, a, b, amount);
    uint total_balance_after = assetsOf(e, a) + assetsOf(e, b);

    assert (total_balance_after <= total_balance_before);
}
