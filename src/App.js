import './App.css';
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import TokenArtifact from "./artifacts/contracts/TuringToken.sol/TuringToken.json";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Endereço do contrato
const contractABI = TokenArtifact.abi;

export default function TuringDapp() {
    const [contract, setContract] = useState(null);
    const [codename, setCodename] = useState("");
    const [amount, setAmount] = useState("");
    const [ranking, setRanking] = useState([]);
    const [account, setAccount] = useState(null); // Estado para armazenar a conta conectada

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
        if (window.ethereum) {
            const checkAccount = async () => {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = web3Provider.getSigner();
                    setContract(new ethers.Contract(contractAddress, contractABI, signer));
                }
            };
            checkAccount();
        }
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
                        return { codiname, votes: ethers.utils.formatUnits(votes, 18) }; // Convertendo os votos para o formato legível
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
            // Atualizar o ranking quando o contrato for configurado
            updateRanking();

            const handleVoteCast = (voter, amount) => {
                console.log(`Vote lançado por ${voter}: ${amount} Turings`);
                updateRanking();
            };

            const handleTokenEmitido = (voter, codiname, amount) => {
                console.log(`Token emitido para ${codiname} por ${voter}: ${ethers.utils.formatUnits(amount, 18)} Turings`);
            };

            const handleRecompensaEmitida = (voter, amount) => {
                console.log(`Recompensa de ${ethers.utils.formatUnits(amount, 18)} Turings emitida para ${voter}`);
            };

            const handleCodinomeAutorizado = (account, codiname) => {
                console.log(`Codinome autorizado: ${codiname} para ${account}`);
            };

            const handleVotacaoAtiva = () => {
                console.log("A votação foi ativada.");
            };

            const handleVotacaoDesativada = () => {
                console.log("A votação foi desativada.");
            };

            
            // Remover listeners antigos de eventos e adicionando novos
            contract.off("VotoEmitido", handleVoteCast); 
            contract.on("VotoEmitido", handleVoteCast);

            contract.off("TokenEmitido", handleTokenEmitido);
            contract.on("TokenEmitido", handleTokenEmitido);

            contract.off("RecompensaEmitida", handleRecompensaEmitida); 
            contract.on("RecompensaEmitida", handleRecompensaEmitida);

            contract.off("CodinomeAutorizado", handleCodinomeAutorizado); 
            contract.on("CodinomeAutorizado", handleCodinomeAutorizado);

            contract.off("VotacaoJaAtiva", handleVotacaoAtiva); 
            contract.on("VotacaoJaAtiva", handleVotacaoAtiva);

            contract.off("VotacaoJaDesativada", handleVotacaoDesativada); 
            contract.on("VotacaoJaDesativada", handleVotacaoDesativada);

            return () => {
                contract.off("VotoEmitido", handleVoteCast);
                contract.off("TokenEmitido", handleTokenEmitido);
                contract.off("RecompensaEmitida", handleRecompensaEmitida);
                contract.off("CodinomeAutorizado", handleCodinomeAutorizado);
                contract.off("VotacaoJaAtiva", handleVotacaoAtiva);
                contract.off("VotacaoJaDesativada", handleVotacaoDesativada);
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
                const tx = await contract.issueToken(codename, ethers.utils.parseUnits(amount, 18));
                await tx.wait();
                alert("Token emitido com sucesso!");
            } catch (error) {
                console.error("Erro ao emitir token:", error);
                alert("Falha ao emitir token. Verifique seu saldo e tente novamente.");
            }
        }
    };

    const vote = async () => {
        if (!codename || !amount) {
            alert("Por favor, preencha os campos de Codename e Quantidade.");
            return;
        }

        if (contract && account) {
            try {
                const tx = await contract.vote(codename, ethers.utils.parseUnits(amount, 18));
                await tx.wait();
                alert("Voto registrado com sucesso!");
            } catch (error) {
                console.error("Erro ao votar:", error);
                alert("Falha ao votar. Verifique seu saldo e tente novamente.");
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
                console.error("Erro ao ativar votação:", error);
                alert("Erro ao ativar a votação. Tente novamente.");
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
                console.error("Erro ao desativar votação:", error);
                alert("Erro ao desativar a votação. Tente novamente.");
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
                    placeholder="Codename"
                    value={codename}
                    onChange={(e) => setCodename(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                />
                <input
                    type="text"
                    placeholder="Quantidade"
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
