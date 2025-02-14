import './App.css';
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import TokenArtifact from "./artifacts/contracts/TuringToken.sol/TuringToken.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Endereço do contrato
const contractABI = TokenArtifact.abi;
const decimals = 2;

export default function TuringDapp() {
    const [contract, setContract] = useState(null);
    const [codename, setCodename] = useState("");
    const [amount, setAmount] = useState("");
    const [ranking, setRanking] = useState([]);
    const [account, setAccount] = useState(null);
    const [message, setMessage] = useState("");

    // Função para conectar ao MetaMask
    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = web3Provider.getSigner();
                setAccount(accounts[0]);
                setContract(new ethers.Contract(contractAddress, contractABI, signer));
            } catch (error) {
                console.error("Erro ao conectar ao MetaMask:", error);
                alert("Falha ao conectar ao MetaMask. Tente novamente.");
            }
        } else {
            console.error("MetaMask não encontrado. Instale o MetaMask.");
            alert("MetaMask não encontrado. Instale o MetaMask.");
        }
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = web3Provider.getSigner();
                setContract(new ethers.Contract(contractAddress, contractABI, signer));
            }
        };
    
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged);
        }
    
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            }
        };
    }, []);

    const updateRanking = useCallback(async () => {
        if (contract) {
            try {
                // Buscando todos os codinomes do contrato
                const names = await contract.getAllNames();
                // Pegando os votos para cada codiname
                const rankingData = await Promise.all(
                    names.map(async (codiname) => {
                        const votes = await contract.getTuringsForCodiname(codiname);
                        let amount_parsed = parseFloat(ethers.utils.formatUnits(votes, 18)).toFixed(3)
                        return { codiname, votes: amount_parsed }; // Convertendo os votos para o formato legível
                    })
                );

                // Ordenando os codinomes pelo número de votos
                const ranked = rankingData.sort((a, b) => b.votes - a.votes);
                setRanking(ranked);
            } catch (error) {
                console.error("Erro ao atualizar ranking:", error);
            }
        }
    }, [contract]);
    
    useEffect(() => {
        if (contract) {

            updateRanking();

            const handleVotoEmitido = (codiname, amount) => {
                let amount_parsed = parseFloat(ethers.utils.formatUnits(amount, 18)).toFixed(3)
                console.log(`Voto emitido para ${codiname.toString()}: ${amount_parsed} Turings`);
                updateRanking();
            };

            const handleTokenEmitido = (codiname, amount) => {
                let amount_parsed = parseFloat(ethers.utils.formatUnits(amount, 18)).toFixed(3)
                console.log(`Token emitido para ${codiname}: ${amount_parsed} Turings`);
                updateRanking();
            };

            const handleRecompensaEmitida = (amount) => {
                let amount_parsed = parseFloat(ethers.utils.formatUnits(amount, 18)).toFixed(3)
                console.log(`Recompensa de ${amount_parsed} Turings emitida`);
                updateRanking();
            };

            const handleVotacaoAtiva = () => {
                console.log("A votação foi ativada.");
            };

            const handleVotacaoDesativada = () => {
                console.log("A votação foi desativada.");
            };

            const handleApenasOwnerOrProfessora = () => {
                console.log("Permitido apenas para owner e professora");
            };
            
            const handleApenasVotanteAutorizado = (votante) => {
                console.log(`${votante} nao esta autorizado a votar`);
            };

            const handleApenasCodinomeValido = (codiname) => {
                console.log(`${codiname} eh invalido.`);
            };
            
            const handleEnderecoInvalido = (codiname) => {
                console.log(`Endereco do ${codiname} eh invalido`);
            };

            const handleVotouEmSi = () => {
                console.log("Nao eh possivel votar em si mesmo.");
            };

            const handleTuringAcimaLimite = () => {
                console.log("Quantidade de Turing acima do permitido");
            };

            const handleJaVotouNoCodinome = (codiname) => {
                console.log(`O ${codiname} ja foi votado.`);
            };

            contract.on("VotoEmitido", handleVotoEmitido);
            contract.on("TokenEmitido", handleTokenEmitido);
            contract.on("RecompensaEmitida", handleRecompensaEmitida);
            contract.on("VotacaoJaAtiva", handleVotacaoAtiva);
            contract.on("VotacaoJaDesativada", handleVotacaoDesativada);
            contract.on("ApenasOwnerOrProfessora",handleApenasOwnerOrProfessora);
            contract.on("ApenasVotanteAutorizado",handleApenasVotanteAutorizado);
            contract.on("ApenasCodinomeValido",handleApenasCodinomeValido);
            contract.on("EnderecoInvalido",handleEnderecoInvalido);
            contract.on("VotouEmSi",handleVotouEmSi);
            contract.on("TuringAcimaLimite",handleTuringAcimaLimite);
            contract.on("JaVotouNoCodinome",handleJaVotouNoCodinome);

            return () => {
                contract.off("VotoEmitido", handleVotoEmitido);
                contract.off("TokenEmitido", handleTokenEmitido);
                contract.off("RecompensaEmitida", handleRecompensaEmitida);
                contract.off("VotacaoJaAtiva", handleVotacaoAtiva);
                contract.off("VotacaoJaDesativada", handleVotacaoDesativada);
                contract.off("ApenasOwnerOrProfessora",handleApenasOwnerOrProfessora);
                contract.off("ApenasVotanteAutorizado",handleApenasVotanteAutorizado);
                contract.off("ApenasCodinomeValido",handleApenasCodinomeValido);
                contract.off("EnderecoInvalido",handleEnderecoInvalido);
                contract.off("VotouEmSi",handleVotouEmSi);
                contract.off("TuringAcimaLimite",handleTuringAcimaLimite);
                contract.off("JaVotouNoCodinome",handleJaVotouNoCodinome);
            };
        }
    }, [contract, updateRanking]);

    const issueToken = async () => {
        if (!codename || !amount) {
            alert("Por favor, preencha os campos de Codename e Quantidade.");
            return;
        }
        if (contract && account) {
            try {
                let converted_amount = (amount * (10**18)).toString();
                const tx = await contract.issueToken(codename, converted_amount);
                await tx.wait();
                alert("Token emitido com sucesso!");
            } catch (error) {
                alert("Falha ao emitir token. Verifique o terminal do hardhat.");
            }
        }
    };

    const vote = async () => {
        if (!codename || !amount) {
            alert("Por favor, preencha os campos de Codename e Quantidade.");
            return;
        }
        if (amount > 2){
            alert("Limite de 2 Turings.");
            return;
        }
        if (contract && account) {
            try {
                let converted_amount = (amount * (10**18)).toString();
                const tx = await contract.vote(codename, converted_amount);
                await tx.wait();
                alert("Voto registrado com sucesso!");
            } catch (error) {
                alert("Falha ao votar. Verifique o terminal do hardhat.");
            }
        }
    };

    const votingOn = async () => {
        if (contract && account) {
            try {
                const tx = await contract.votingOn();
                await tx.wait();
                alert("Votação ativada!");
            } catch (error) {
                alert("Falha ao ativar votação. Verifique o terminal do hardhat.");
            }
        }
    };

    const votingOff = async () => {
        if (contract && account) {
            try {
                const votingStatus = await contract.votingEnabled(); 
                if (!votingStatus) {
                    alert("A votação já está desativada.");
                    return;
                }
                const tx = await contract.votingOff();
                await tx.wait();
                alert("Votação desativada!");
            } catch (error) {
                alert("Falha ao desativar votação. Verifique o terminal do hardhat.");
            }
        }
    };    

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Turing Token DApp</h2>

            {!account ? (
                <button
                    onClick={connectMetaMask}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Conectar ao MetaMask
                </button>
            ) : (
                <div>
                    <p><strong>Conta conectada:</strong> {account}</p>
                </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Codinome"
                    value={codename}
                    onChange={(e) => setCodename(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                />
                <input
                    type="text"
                    placeholder="Turings"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="p-2 border rounded w-full"
                />
            </div>

            <div className="flex flex-wrap gap-4">
                <button onClick={issueToken} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Emitir Token
                </button>
                <button onClick={vote} className="px-4 py-2 bg-green-500 text-white rounded">
                    Votar
                </button>
                <button onClick={votingOn} className="px-4 py-2 bg-yellow-500 text-white rounded">
                    Ativar Votação
                </button>
                <button onClick={votingOff} className="px-4 py-2 bg-red-500 text-white rounded">
                    Desativar Votação
                </button>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold">Ranking</h3>
                <table className="table-auto w-full border-collapse mt-4">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border">Codinome</th>
                            <th className="px-4 py-2 border">Votos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((entry, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 border">{entry.codiname}</td>
                                <td className="px-4 py-2 border">{entry.votes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
