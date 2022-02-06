// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.4;

contract ERC20 {
    uint256 total;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowance;

    function totalSupply() external view returns (uint) {
        return total;
    }
    
    function balanceOf(address account) public view returns (uint) {
        return balances[account];
    }

}

contract PopsicleFixed is ERC20 {
    event Deposit(address user_address, uint deposit_amount);
    event Withdraw(address user_address, uint withdraw_amount);
    event CollectFees(address collector, uint totalCollected);
    
    uint totalFeesEarned = 0; // total fees earned per share

    mapping (address => uint) userFeesPaid;
    mapping (address => uint) userRewards;

    modifier updateVault(address user) {
        uint reward = balances[user] * (totalFeesEarned - userFeesPaid[user]);
        userFeesPaid[user] = totalFeesEarned;
        userRewards[user] += reward;
        _;
    }

    function deposit() public payable updateVault(msg.sender) {
        // mint new tokens
        total += msg.value;
        balances[msg.sender] += msg.value; 

        emit Deposit(msg.sender, msg.value);
    }


    function withdraw(uint amount) public updateVault(msg.sender) {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;        
        total -= amount;
        msg.sender.call{value: amount}("");
        
        emit Withdraw(msg.sender, amount);
    }

    function collectFees() public updateVault(msg.sender) {
        require(totalFeesEarned >= userFeesPaid[msg.sender]);
        uint to_pay = userRewards[msg.sender];
        userRewards[msg.sender] = 0;
        msg.sender.call{value: to_pay}("");
        
        emit CollectFees(msg.sender, to_pay);
    }

    // ------------------------------------ The Fix ------------------------------------
    function transfer(address recipient, uint amount) public returns(bool) {
        return transferFrom(msg.sender, recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint amount) 
            public updateVault(sender) updateVault(recipient) returns(bool) {
        require(balances[sender] >= amount);
        balances[sender] = balances[sender] - amount;
        balances[recipient] = balances[recipient] + amount;
        return true;
    }
    // ----------------------------------------------------------------------------------


    function OwnerDoItsJobAndEarnsFeesToItsClients() public payable {
        totalFeesEarned += 1;
    }

    // --------------------------------- added for spec ---------------------------------
    function assetsOf(address user) public view returns(uint) {
        return userRewards[user] + balances[user] * (totalFeesEarned - userFeesPaid[user]);
    }

    function userR(address user) public view returns(uint) {
        return userRewards[user];
    }

    function userFC(address user) public view returns(uint) {
        return userFeesPaid[user];
    }
    
    function getTotalFeesEarned() public view returns(uint) {
        return totalFeesEarned;
    }
}