// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Virtual Card Request Contract
 * @dev Handles virtual card requests with user payment and admin approval workflow
 * @author OnlyBnB Team
 */
contract VirtualCardRequest is ReentrancyGuard, Ownable, Pausable, AccessControl {
    // Chainlink price feeds
    AggregatorV3Interface public bnbUsdFeed;
    AggregatorV3Interface public usdSgdFeed;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    // Contract state
    uint256 public totalRequests;
    uint256 public totalVolume;
    uint256 public platformFeePercentage = 250; // 2.5% (250 basis points)
    uint256 public constant BASIS_POINTS = 10000;

    // Virtual Card Request structure
    struct CardRequest {
        uint256 requestId;
        address requester;
        uint256 amountSGD; // Amount in SGD (in cents)
        uint256 amountBNB; // Amount in BNB (in wei)
        uint256 timestamp;
        RequestStatus status;
        address approver; // Who approved the request
        uint256 approvedAt; // When it was approved
    }

    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Cancelled,
        Completed
    }

    // Mappings
    mapping(uint256 => CardRequest) public requests;
    mapping(address => uint256[]) public userRequests;
    mapping(address => bool) public authorizedRequesters;

    // Events
    event VirtualCardRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 amountSGD,
        uint256 amountBNB
    );

    event VirtualCardApproved(
        uint256 indexed requestId,
        address indexed approver,
        address indexed requester
    );

    event VirtualCardRejected(
        uint256 indexed requestId,
        address indexed approver,
        address indexed requester,
        string reason
    );

    event VirtualCardCancelled(
        uint256 indexed requestId,
        address indexed requester
    );

    event VirtualCardCompleted(
        uint256 indexed requestId,
        address indexed requester
    );

    event PaymentReleased(
        uint256 indexed requestId,
        address indexed requester,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed requestId,
        address indexed requester,
        uint256 amount
    );

    // Modifiers
    modifier onlyAuthorizedRequester() {
        require(authorizedRequesters[msg.sender], "VirtualCard: Requester not authorized");
        _;
    }

    modifier validRequest(uint256 requestId) {
        require(requestId > 0 && requestId <= totalRequests, "VirtualCard: Invalid request ID");
        _;
    }

    modifier onlyApprover() {
        require(hasRole(APPROVER_ROLE, msg.sender), "VirtualCard: Only approvers can approve");
        _;
    }

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, msg.sender), "VirtualCard: Only managers can perform this action");
        _;
    }

    constructor(
        address _bnbUsdFeed,
        address _usdSgdFeed
    ) Ownable(msg.sender) {
        bnbUsdFeed = AggregatorV3Interface(_bnbUsdFeed);
        usdSgdFeed = AggregatorV3Interface(_usdSgdFeed);

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(APPROVER_ROLE, msg.sender);
    }

    /**
     * @dev Request a virtual card with BNB payment
     * @param amountSGD Amount in SGD (in cents)
     */
    function requestVirtualCard(
        uint256 amountSGD
    )
        external
        payable
        whenNotPaused
        nonReentrant
        onlyAuthorizedRequester
    {

        // Calculate required BNB amount using price feeds
        uint256 requiredBNB = calculateRequiredBNB(amountSGD);
        require(msg.value >= requiredBNB, "VirtualCard: Insufficient BNB payment");

        // Create request
        totalRequests++;
        uint256 requestId = totalRequests;

        requests[requestId] = CardRequest({
            requestId: requestId,
            requester: msg.sender,
            amountSGD: amountSGD,
            amountBNB: msg.value,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            approver: address(0),
            approvedAt: 0
        });

        userRequests[msg.sender].push(requestId);
        totalVolume += msg.value;

        emit VirtualCardRequested(
            requestId,
            msg.sender,
            amountSGD,
            msg.value
        );
    }

    /**
     * @dev Approve a virtual card request (admin/manager action)
     * @param requestId The request ID to approve
     */
    function approveVirtualCard(uint256 requestId)
        external
        validRequest(requestId)
        onlyApprover
        whenNotPaused
    {
        CardRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Pending, "VirtualCard: Invalid request status");

        request.status = RequestStatus.Approved;
        request.approver = msg.sender;
        request.approvedAt = block.timestamp;

        emit VirtualCardApproved(requestId, msg.sender, request.requester);
    }

    /**
     * @dev Reject a virtual card request (admin/manager action)
     * @param requestId The request ID to reject
     * @param reason Reason for rejection
     */
    function rejectVirtualCard(uint256 requestId, string memory reason)
        external
        validRequest(requestId)
        onlyApprover
        whenNotPaused
        nonReentrant
    {
        CardRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Pending, "VirtualCard: Invalid request status");

        request.status = RequestStatus.Rejected;
        request.approver = msg.sender;

        // Refund the requester
        uint256 refundAmount = request.amountBNB;
        request.amountBNB = 0;

        (bool success, ) = payable(request.requester).call{value: refundAmount}("");
        require(success, "VirtualCard: Refund failed");

        emit VirtualCardRejected(requestId, msg.sender, request.requester, reason);
        emit RefundIssued(requestId, request.requester, refundAmount);
    }

    /**
     * @dev Cancel a virtual card request (user action)
     * @param requestId The request ID to cancel
     */
    function cancelVirtualCardRequest(uint256 requestId)
        external
        validRequest(requestId)
        whenNotPaused
        nonReentrant
    {
        CardRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Pending, "VirtualCard: Invalid request status");
        require(msg.sender == request.requester, "VirtualCard: Only requester can cancel");

        request.status = RequestStatus.Cancelled;

        // Refund the requester
        uint256 refundAmount = request.amountBNB;
        request.amountBNB = 0;

        (bool success, ) = payable(request.requester).call{value: refundAmount}("");
        require(success, "VirtualCard: Refund failed");

        emit VirtualCardCancelled(requestId, msg.sender);
        emit RefundIssued(requestId, request.requester, refundAmount);
    }

    /**
     * @dev Complete a virtual card request and release payment
     * @param requestId The request ID to complete
     */
    function completeVirtualCardRequest(uint256 requestId)
        external
        validRequest(requestId)
        onlyManager
        whenNotPaused
        nonReentrant
    {
        CardRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Approved, "VirtualCard: Request must be approved");
        require(msg.sender == request.approver || hasRole(MANAGER_ROLE, msg.sender),
                "VirtualCard: Only approver or manager can complete");

        request.status = RequestStatus.Completed;

        // Calculate platform fee
        uint256 platformFee = (request.amountBNB * platformFeePercentage) / BASIS_POINTS;
        uint256 requesterAmount = request.amountBNB - platformFee;

        // Release payment to requester (simulating virtual card issuance)
        request.amountBNB = 0;

        (bool success, ) = payable(request.requester).call{value: requesterAmount}("");
        require(success, "VirtualCard: Payment release failed");

        emit VirtualCardCompleted(requestId, request.requester);
        emit PaymentReleased(requestId, request.requester, requesterAmount);
    }

    /**
     * @dev Calculate required BNB amount for given SGD amount
     * @param amountSGD Amount in SGD (in cents)
     * @return Required BNB amount in wei
     */
    function calculateRequiredBNB(uint256 amountSGD) public view returns (uint256) {
        // Get BNB/USD price
        (, int256 bnbUsdPrice, , , ) = bnbUsdFeed.latestRoundData();
        require(bnbUsdPrice > 0, "VirtualCard: Invalid BNB/USD price");

        // Get USD/SGD price
        (, int256 usdSgdPrice, , , ) = usdSgdFeed.latestRoundData();
        require(usdSgdPrice > 0, "VirtualCard: Invalid USD/SGD price");

        // Convert SGD to USD, then to BNB
        // amountSGD is in cents, so divide by 100 to get SGD
        uint256 amountSGDDecimal = amountSGD / 100;
        uint256 amountUSD = (amountSGDDecimal * 1e8) / uint256(usdSgdPrice);
        uint256 amountBNB = (amountUSD * 1e18) / uint256(bnbUsdPrice);

        return amountBNB;
    }

    /**
     * @dev Get current BNB price in SGD
     * @return BNB price in SGD (with 18 decimals)
     */
    function getBNBPriceInSGD() external view returns (uint256) {
        (, int256 bnbUsdPrice, , , ) = bnbUsdFeed.latestRoundData();
        (, int256 usdSgdPrice, , , ) = usdSgdFeed.latestRoundData();

        require(bnbUsdPrice > 0 && usdSgdPrice > 0, "VirtualCard: Invalid price feeds");

        // BNB/SGD = BNB/USD * USD/SGD
        return (uint256(bnbUsdPrice) * uint256(usdSgdPrice)) / 1e8;
    }

    /**
     * @dev Get request details
     * @param requestId The request ID
     * @return VirtualCardRequest struct
     */
    function getRequest(uint256 requestId) external view validRequest(requestId) returns (CardRequest memory) {
        return requests[requestId];
    }

    /**
     * @dev Get user's requests
     * @param user The user's address
     * @return Array of request IDs
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    /**
     * @dev Get requests by status
     * @param status The request status
     * @return Array of request IDs with the specified status
     */
    function getRequestsByStatus(RequestStatus status) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](totalRequests);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalRequests; i++) {
            if (requests[i].status == status) {
                result[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    /**
     * @dev Authorize a requester
     * @param requester The requester's address
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedRequester(address requester, bool authorized) external onlyManager {
        authorizedRequesters[requester] = authorized;
    }

    /**
     * @dev Grant approver role
     * @param approver The approver's address
     */
    function grantApproverRole(address approver) external onlyOwner {
        grantRole(APPROVER_ROLE, approver);
    }

    /**
     * @dev Grant manager role
     * @param manager The manager's address
     */
    function grantManagerRole(address manager) external onlyOwner {
        grantRole(MANAGER_ROLE, manager);
    }

    /**
     * @dev Revoke approver role
     * @param approver The approver's address
     */
    function revokeApproverRole(address approver) external onlyOwner {
        revokeRole(APPROVER_ROLE, approver);
    }

    /**
     * @dev Revoke manager role
     * @param manager The manager's address
     */
    function revokeManagerRole(address manager) external onlyOwner {
        revokeRole(MANAGER_ROLE, manager);
    }

    /**
     * @dev Set platform fee percentage
     * @param feePercentage Fee percentage in basis points (e.g., 250 = 2.5%)
     */
    function setPlatformFee(uint256 feePercentage) external onlyOwner {
        require(feePercentage <= 1000, "VirtualCard: Fee too high"); // Max 10%
        platformFeePercentage = feePercentage;
    }

    /**
     * @dev Update price feed addresses
     * @param _bnbUsdFeed New BNB/USD feed address
     * @param _usdSgdFeed New USD/SGD feed address
     */
    function updatePriceFeeds(
        address _bnbUsdFeed,
        address _usdSgdFeed
    )
        external
        onlyOwner
    {
        bnbUsdFeed = AggregatorV3Interface(_bnbUsdFeed);
        usdSgdFeed = AggregatorV3Interface(_usdSgdFeed);
    }

    /**
     * @dev Emergency pause
     */
    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause()
        external
        onlyOwner
    {
        _unpause();
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees()
        external
        onlyOwner
    {
        uint256 balance = address(this).balance;
        require(balance > 0, "VirtualCard: No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "VirtualCard: Withdrawal failed");
    }

    /**
     * @dev Emergency withdraw (owner only, when paused)
     */
    function emergencyWithdraw()
        external
        onlyOwner
    {
        require(
            paused(),
            "VirtualCard: Must be paused"
        );

        uint256 balance = address(this).balance;

        require(
            balance > 0,
            "VirtualCard: No funds to withdraw"
        );

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "VirtualCard: Emergency withdrawal failed");
    }

    /**
     * @dev Get contract balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get contract statistics
     * @return totalRequests Total number of requests
     * @return totalVolume Total volume in wei
     * @return platformFeePercentage Current platform fee percentage
     */
    function getContractStats()
        external
        view
        returns (uint256, uint256, uint256)
    {
        return (
            totalRequests,
            totalVolume,
            platformFeePercentage
        );
    }

    /**
     * @dev Get pending requests count
     * @return Number of pending requests
     */
    function getPendingRequestsCount()
        external
        view
        returns (uint256)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalRequests; i++) {
            if (requests[i].status == RequestStatus.Pending) {
                count++;
            }
        }
        return count;
    }
}
