// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TuringToken is ERC20 {
    address public owner;
    address public professora = address(0x502542668aF09fa7aea52174b9965A7799343Df7);

    address[] public addresses = [
        address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8),
        address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC),
        address(0x90F79bf6EB2c4f870365E785982E1f101E93b906),
        address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65),
        address(0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc),
        address(0x976EA74026E726554dB657fA54763abd0C3a0aa9),
        address(0x14dC79964da2C08b23698B3D3cc7Ca32193d9955),
        address(0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f),
        address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720),
        address(0xBcd4042DE499D14e55001CcbB24a551F3b954096),
        address(0x71bE63f3384f5fb98995898A86B02Fb2426c5788),
        address(0xFABB0ac9d68B0B445fB7357272Ff202C5651694a),
        address(0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec),
        address(0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097),
        address(0xcd3B766CCDd6AE721141F452C550Ca635964ce71),
        address(0x2546BcD3c84621e976D8185a91A922aE77ECEc30),
        address(0xbDA5747bFD65F08deb54cb465eB87D40e51B197E),
        address(0xdD2FD4581271e230360230F9337D5c0430Bf44C0),
        address(0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199)
    ];

    string[] public names = [
        "nome1", "nome2", "nome3", "nome4", "nome5", "nome6", "nome7", "nome8", "nome9", "nome10",
        "nome11", "nome12", "nome13", "nome14", "nome15", "nome16", "nome17", "nome18", "nome19"
    ];

    mapping (string => address) codinameAdresses;
    mapping (string => bool) hasVoted;
    mapping (address => uint256) public AddressTurings;

    bool public votingEnabled;

    event TokenEmitido(string indexed codiname, uint256 quantidade);
    event VotoEmitido(string indexed codinome, uint256 quantidade);
    event RecompensaEmitida(uint256 quantidade);
    event VotacaoJaAtiva();
    event VotacaoJaDesativada();
    event ApenasOwnerOrProfessora();
    event ApenasVotanteAutorizado(address indexed votante);
    event ApenasCodinomeValido(string indexed codiname);
    event EnderecoInvalido(string indexed codiname);
    event VotouEmSi();
    event TuringAcimaLimite();
    event JaVotouNoCodinome(string indexed codiname);


    constructor() ERC20("TuringToken", "TTK") {
        owner = msg.sender;
        votingEnabled = true;
        for (uint256 i = 0; i < names.length; i++) {
            codinameAdresses[names[i]] = addresses[i];
        }
    }

    modifier onlyOwnerOrProfessora() {
        if (msg.sender != owner && msg.sender != professora){
            emit ApenasOwnerOrProfessora();
        }
        require(msg.sender == owner || msg.sender == professora,"Somente owner ou professora.");
        _;
    }

    modifier onlyAuthorizedAddresses() {
        bool isAuthorized = false;
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == msg.sender) {
                isAuthorized = true;
                break;
            }
        }
        if (!isAuthorized){
            emit ApenasVotanteAutorizado(msg.sender);
        }
        require(isAuthorized, "Acesso negado: Apenas enderecos autorizados podem executar esta funcao.");
        _;
    }

    modifier onlyCodinameValid(string memory codiname){
        bool isAuthorized = false;
        for (uint i = 0; i < names.length; i++) {
            if (keccak256(abi.encodePacked((names[i]))) == keccak256(abi.encodePacked((codiname)))) {
                isAuthorized = true;
                break;
            }
        }
        if (!isAuthorized){
            emit ApenasCodinomeValido(codiname);
        }
        require(isAuthorized, "Acesso negado: Apenas enderecos autorizados podem ser votados.");
        _;
    } 

    modifier isVotingEnabled() {
        require(votingEnabled, "A votacao nao esta ativa.");
        _;
    }

    modifier isVotingDisabled() {
        require(!votingEnabled, "A votacao esta ativa.");
        _;
    }

    modifier isAdressValid(string memory codiname) {
        address receiver = codinameAdresses[codiname];
        if (receiver == address(0)){
            emit EnderecoInvalido(codiname);
        }
        require(receiver != address(0), "Endereco/Codinome invalido.");
        _;
    }

    modifier isVotingItself(string memory codiname) {
        address receiver = codinameAdresses[codiname];
        if (receiver == msg.sender){
            emit VotouEmSi();
        }
        require(receiver != msg.sender, "Nao eh possivel votar em si mesmo.");
        _;
    }

    modifier isTuringQuantityValid(uint256 quantity) {
        if (quantity > 2 * 10**18){
            emit TuringAcimaLimite();
        }
        require(quantity <= 2 * 10**18,"Quantidade de Turing acima do permitido.");
        _;
    }

    modifier isCodinameVoted(string memory codiname) {
        if (hasVoted[codiname]){
            emit JaVotouNoCodinome(codiname);
        }
        require(!hasVoted[codiname],"Este codinome ja foi votado.");
        _;
    }

    function votingOn() public onlyOwnerOrProfessora isVotingDisabled() {
        votingEnabled = true;
        emit VotacaoJaAtiva();
    }

    function votingOff() public onlyOwnerOrProfessora isVotingEnabled() {
        votingEnabled = false;
        emit VotacaoJaDesativada();
    }

    function issueToken(string memory codiname, uint256 amount) public onlyOwnerOrProfessora {
        address receiver = codinameAdresses[codiname];
        require(receiver != address(0), "Codinome invalido.");
        _mint(receiver, amount);

        //uint256 converted_amount = amount / (10**18);
        AddressTurings[receiver] += amount;
        
        // Emitindo evento de emissão de tokens
        emit TokenEmitido(codiname, amount);
    }

    function vote(string memory codiname, uint256 quantity)
        public onlyAuthorizedAddresses onlyCodinameValid(codiname) isVotingEnabled isAdressValid(codiname) 
        isVotingItself(codiname) isTuringQuantityValid(quantity) isCodinameVoted(codiname){
        
        address receiver = codinameAdresses[codiname];
        hasVoted[codiname] = true;

        _mint(receiver, quantity);
        //uint256 converted_quantity = quantity / (10**18);
        AddressTurings[receiver] += quantity;
        emit VotoEmitido(codiname, quantity);

        uint256 recompensa = (2 * (10**17));
        _mint(msg.sender, recompensa);
        AddressTurings[msg.sender] += recompensa;
        emit RecompensaEmitida(recompensa);

    }

    // Função para obter todos os codinomes
    function getAllNames() public view returns (string[] memory) {
        return names;
    }

     // Função para obter os votos de um codiname específico
    function getTuringsForCodiname(string memory codiname) public view returns (uint256) {
        return AddressTurings[codinameAdresses[codiname]];
    }
}
