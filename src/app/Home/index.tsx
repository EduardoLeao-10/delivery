// src/app/Home/index.tsx
// src/app/Home/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import {
	Container,
	Title,
	CategoryContainer,
	CategoryButton,
	CategoryText,
	ProductButton,
	ProductText,
	TableHeader,
	TableInput, // Seu input estilizado para web
	NextButton,
	NextButtonText,
	TableRow,
	TableCell,
	TableBody,
	TableFooter,
	TotalText,
} from "./styles";
import { database } from "../../services/firebaseConfig";
// --- Importações do Firebase Database ---
import { ref, set, push, get, remove, update } from "firebase/database";
import { Product } from "../types"; // Ajuste o caminho se necessário
// Mantém o TextInput do RN se precisar em outro lugar, mas não parece usado aqui.
// import { TextInput as ReactNativeTextInput } from 'react-native';

// --- Interface para itens do pedido ---
interface OrderItem {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
	category: string;
	// Estes campos são incluídos ao adicionar/atualizar o item, mas podem ser redundantes
	// se o principal objetivo é salvar no nível do pedido em goToOrderView.
	// Considere se realmente precisa deles DENTRO de cada item no Firebase.
	customerName: string;
	customerAddress: string;
	customerPhone: string;
}

// --- Funções Utilitárias ---
const capitalizeFirstLetter = (str: string): string => {
	if (!str) return "";
	return str
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

const formatPhoneNumber = (value: string): string => {
    if (!value) return "";
	const cleanedValue = value.replace(/\D/g, '');
    // Prioriza (XX) XXXXX-XXXX
	const matchLong = cleanedValue.match(/^(\d{2})(\d{5})(\d{4})$/);
	if (matchLong) {
		return `(${matchLong[1]}) ${matchLong[2]}-${matchLong[3]}`;
	}
    // Tenta (XX) XXXX-XXXX
    const matchShort = cleanedValue.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (matchShort) {
        return `(${matchShort[1]}) ${matchShort[2]}-${matchShort[3]}`;
    }
    // Retorna parcialmente formatado se não couber nos padrões
    if (cleanedValue.length > 2) {
        return `(${cleanedValue.slice(0, 2)}) ${cleanedValue.slice(2)}`;
    }
	return cleanedValue; // Retorna apenas dígitos se for muito curto
};

const formatCurrency = (value: number): string => {
	if (isNaN(value)) return "0,00";
	return value.toLocaleString("pt-BR", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

// Converte string formatada (ex: "1.234,56") para número (ex: 1234.56)
const parseCurrency = (value: string): number => {
    if (!value) return 0;
	// Remove pontos de milhar e substitui vírgula decimal por ponto
	const cleanedValue = value.replace(/\./g, '').replace(',', '.');
    // Remove quaisquer outros caracteres não numéricos (exceto o ponto decimal agora)
    const numericString = cleanedValue.replace(/[^\d.]/g, '');
	const numericValue = parseFloat(numericString);
	return isNaN(numericValue) ? 0 : numericValue;
};


// --- Componente Principal ---
export default function Home() {
	// --- Estados ---
	const [categories, setCategories] = useState<string[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [selectedItem, setSelectedItem] = useState<string>(""); // Nome do item manual
	const [selectedUnitPrice, setSelectedUnitPrice] = useState<number>(0); // Preço unitário manual
	const [selectedQuantity, setSelectedQuantity] = useState<number>(1); // Quantidade manual
	const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // ID do pedido ativo

	// Estados do Cliente
	const [customerName, setCustomerName] = useState<string>("");
	const [customerAddress, setCustomerAddress] = useState<string>("");
	const [customerPhone, setCustomerPhone] = useState<string>("");

	// Estados do Pagamento
	const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
	const [paymentValue, setPaymentValue] = useState<string>(''); // Valor pago (string para input formatado)

	// Produtos fixos (Exemplo)
	const [fixedProducts] = useState<Product[]>([
        { id: "fixo_1", name: "Curriculo", category: "Trabalho", price: 15.0 },
        { id: "fixo_2", name: "Curriculo PDF", category: "Trabalho", price: 5.0 },
        { id: "fixo_3", name: "Xerox", category: "Impressão", price: 1.0 },
        { id: "fixo_4", name: "Imp Curriculo 1f", category: "Impressão", price: 3.0 },
        { id: "fixo_5", name: "Imp Curriculo 2f", category: "Impressão", price: 4.0 },
        { id: "fixo_6", name: "Musica Selecionar", category: "Musica", price: 2.0 },
        { id: "fixo_7", name: "Detran", category: "Veiculo", price: 10.0 },
	]);

	const router = useRouter();

    // Calcula Total do item manual dinamicamente
	const manualItemTotal = selectedQuantity * selectedUnitPrice;

	// --- Effects ---

	// Busca produtos do Firebase na montagem inicial
	useEffect(() => {
		const fetchData = async () => {
            console.log("Buscando produtos do Firebase...");
			try {
				const dbRef = ref(database, "menu");
				const snapshot = await get(dbRef);
				let fetchedProducts: Product[] = [];
				if (snapshot.exists()) {
					const data: Record<string, Product> = snapshot.val();
					// Mapeia os dados para incluir o ID do Firebase
					fetchedProducts = Object.entries(data).map(([id, item]) => ({
						...item,
						id, // Usa a chave do Firebase como ID
                        // Garante que 'price' seja número
                        price: Number(item.price) || 0,
                        // Garante que outros campos existam (opcional)
                        name: item.name || "Produto sem nome",
                        category: item.category || "Sem categoria",
					}));
					setProducts(fetchedProducts);
					console.log(`${fetchedProducts.length} produtos carregados do Firebase.`);
				} else {
					console.log("Nenhum produto encontrado no nó 'menu' do Firebase.");
                    setProducts([]); // Define como vazio se não encontrar
				}

                // Combina produtos fixos e do Firebase para extrair categorias
                const combinedProducts = [...fixedProducts, ...fetchedProducts];
				const uniqueCategories = [...new Set(combinedProducts.map((item) => item.category))];
                setCategories(uniqueCategories);
                console.log("Categorias definidas:", uniqueCategories);

			} catch (error) {
				console.error("Erro ao buscar produtos do Firebase:", error);
                alert("Erro ao buscar produtos do Firebase. Usando apenas os fixos.");
                // Em caso de erro, usa apenas categorias dos produtos fixos
                const fixedCategories = [...new Set(fixedProducts.map((item) => item.category))];
                setCategories(fixedCategories);
                setProducts([]); // Limpa produtos do Firebase em caso de erro
			}
		};
		fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Dependência vazia [] garante que rode só uma vez na montagem

    // Busca/Limpa dados de um pedido quando currentOrderId muda
	useEffect(() => {
		const fetchOrderData = async () => {
			if (!currentOrderId) {
                console.log("Nenhum pedido ativo (currentOrderId nulo), limpando estado local.");
                clearOrderState(); // Limpa tudo se não há ID ativo
                return;
            }

            console.log("Tentando carregar dados do pedido existente:", currentOrderId);
			const orderRef = ref(database, `pedidos/${currentOrderId}`);
			try {
                const snapshot = await get(orderRef);
                if (snapshot.exists()) {
                    const orderData = snapshot.val();
                    console.log("Dados carregados do pedido:", currentOrderId, orderData);
                    // Preenche os campos com os dados do pedido existente
                    setCustomerName(orderData.customerName || "");
                    setCustomerAddress(orderData.customerAddress || "");
                    setCustomerPhone(orderData.customerPhone ? formatPhoneNumber(orderData.customerPhone) : "");
                    setPaymentMethod(orderData.paymentMethod || "Dinheiro");
                    setPaymentValue(orderData.paymentValue ? formatCurrency(orderData.paymentValue) : '');
                    // Carrega os itens do pedido (se existirem)
                    setOrderItems(orderData.itens ? Object.values(orderData.itens) as OrderItem[] : []);
                } else {
                    // Se o ID existe mas o pedido não foi encontrado no DB (raro, mas possível)
                    console.warn("Pedido com ID", currentOrderId, "não encontrado no Firebase, apesar do ID estar setado. Limpando estado.");
                    alert(`Pedido ${currentOrderId} não encontrado no banco de dados.`);
                    clearOrderState(); // Limpa o estado local
                    setCurrentOrderId(null); // Limpa o ID inválido
                }
            } catch (error) {
                console.error(`Erro ao buscar dados do pedido ${currentOrderId}:`, error);
                alert("Erro ao carregar dados do pedido anterior. Verifique sua conexão.");
                clearOrderState();
                setCurrentOrderId(null);
            }
		};

		fetchOrderData();
        // Roda sempre que currentOrderId mudar
        // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentOrderId]);

	// --- Funções de Manipulação de Estado Local ---

    // ****** INÍCIO DA CORREÇÃO ******
    // Modificada para NÃO limpar os dados do cliente
    const clearOrderState = () => {
        setOrderItems([]); // Limpa os itens do pedido
        // setCustomerName("");      // NÃO limpa mais o nome do cliente
        // setCustomerAddress("");   // NÃO limpa mais o endereço do cliente
        // setCustomerPhone("");     // NÃO limpa mais o telefone do cliente
        setPaymentMethod("Dinheiro"); // Reseta o método de pagamento
        setPaymentValue("");       // Reseta o valor pago
        setSelectedItem("");       // Limpa o campo de item manual
        setSelectedUnitPrice(0);   // Limpa o campo de preço unitário manual
        setSelectedQuantity(1);    // Reseta a quantidade manual
        setSelectedCategory(null);   // Reseta o filtro de categoria
        // Não limpa currentOrderId aqui, pois pode ser chamado ao iniciar um novo pedido
        console.log("Estado local do pedido (itens, pagamento, item manual) limpo. Dados do cliente MANTIDOS.");
    }
    // ****** FIM DA CORREÇÃO ******


	// --- Funções de Interação com Firebase ---

    // FUNÇÃO CORRIGIDA:
    const createNewOrder = async (): Promise<string | null> => { // Adiciona tipo de retorno
        console.log("Tentando criar novo pedido...");
        const pedidosRef = ref(database, "pedidos");
        // 1. Gera a referência e a chave ANTES de tentar usar
        const newOrderRef = push(pedidosRef);
        const newOrderId = newOrderRef.key;

        // 2. Verifica se a chave foi gerada com sucesso
        if (newOrderId) {
            console.log("Novo ID de pedido gerado:", newOrderId);
            // 3. Limpa o estado local do formulário ANTES de salvar no Firebase e definir o ID no estado
            clearOrderState(); // Chama a versão CORRIGIDA de clearOrderState
            // 4. Define o ID do pedido atual no estado (isso disparará o useEffect para buscar, mas estará vazio)
            setCurrentOrderId(newOrderId);

            // 5. Define a estrutura de dados inicial que será salva
            const initialOrderData = {
                customerName: customerName,         // <--- Usa o valor atual do estado do cliente
                customerAddress: customerAddress,   // <--- Usa o valor atual do estado do cliente
                customerPhone: customerPhone.replace(/\D/g, ''), // <--- Usa o valor atual (sem formatação)
                paymentMethod: "Dinheiro",
                paymentValue: 0,
                itens: {}, // Começa sem itens
                createdAt: new Date().toISOString(), // Timestamp de criação
                status: "aberto", // Status inicial ('aberto' ou 'pendente')
                totalOrderValue: 0, // Total inicial
                lastUpdatedAt: new Date().toISOString(), // Timestamp inicial de atualização
            };

            // 6. Tenta salvar os dados iniciais no Firebase DENTRO do 'if'
            try {
                await set(newOrderRef, initialOrderData); // Usa a referência gerada
                console.log("Novo pedido criado no Firebase com dados iniciais:", newOrderId, initialOrderData);
                alert("Novo pedido iniciado! ID: " + newOrderId);
                return newOrderId; // Retorna o ID em caso de sucesso

            } catch (error) {
                console.error("Erro ao criar novo pedido no Firebase:", error);
                alert("Erro ao criar novo pedido no Firebase. Tente novamente.");
                // Se falhar ao salvar, reverte o ID no estado para evitar inconsistência
                setCurrentOrderId(null);
                return null; // Retorna null em caso de falha
            }

        } else {
            // 7. Lida com o caso raro de falha na geração da chave
            console.error("Falha ao obter key (ID) para novo pedido do Firebase.");
            alert("Erro crítico: Não foi possível gerar um ID para o novo pedido.");
            return null; // Retorna null se a chave não pôde ser gerada
        }
    }; // --- FIM DA FUNÇÃO createNewOrder CORRIGIDA ---


	const addToOrder = async (product: Product) => {
        console.log(`Adicionando produto: ${product.name} (ID: ${product.id})`);
		let orderId = currentOrderId;

		// Se não há pedido ativo, tenta criar um novo
		if (!orderId) {
            console.log("Nenhum pedido ativo. Tentando criar um novo...");
			const newId = await createNewOrder(); // Chama a função corrigida
			if (!newId) {
				console.error("Falha ao criar novo pedido em addToOrder. Abortando.");
                // createNewOrder já mostra alerta de erro interno
				return; // Sai se não conseguiu criar o pedido
			}
            orderId = newId; // Usa o novo ID retornado
            // O estado currentOrderId já foi setado dentro de createNewOrder
            console.log("Novo pedido criado implicitamente:", orderId);
		}

        // Garante que temos um ID válido neste ponto
        if (!orderId) {
             console.error("ID do pedido ainda é nulo após tentativa de criação. Abortando addToOrder.");
             alert("Erro inesperado ao obter ID do pedido.");
             return;
        }

		const itemRef = ref(database, `pedidos/${orderId}/itens/${product.id}`);

		try {
            // Busca o item existente para incrementar a quantidade
            console.log(`Verificando item existente em pedidos/${orderId}/itens/${product.id}`);
            const existingItemSnapshot = await get(itemRef);
            let currentQuantity = 0;
            if (existingItemSnapshot.exists()) {
                currentQuantity = existingItemSnapshot.val().quantity || 0;
                console.log(`Item ${product.id} encontrado com quantidade ${currentQuantity}.`);
            } else {
                console.log(`Item ${product.id} não encontrado. Será adicionado.`);
            }

            const newQuantity = currentQuantity + 1;
            const newTotal = newQuantity * (Number(product.price) || 0); // Garante que price é número

            // Prepara os dados do item para salvar no Firebase
			const newOrderItemData: OrderItem = {
				id: product.id,
				name: product.name,
				quantity: newQuantity,
				unitPrice: Number(product.price) || 0,
				total: newTotal,
				category: product.category,
				// Pega dados do cliente do estado ATUAL ao adicionar/atualizar item
                // Estes serão sobrescritos pelos valores finais em goToOrderView
                customerName: customerName,
                customerAddress: customerAddress,
                customerPhone: customerPhone.replace(/\D/g, ''), // Salva sem formatação
			};

            // Usa 'set' para adicionar ou sobrescrever o item específico
            console.log(`Salvando item ${product.id} com quantidade ${newQuantity} no Firebase...`);
			await set(itemRef, newOrderItemData);
            console.log("Item salvo no Firebase.");

			// Atualiza o estado local para refletir a mudança na UI
			setOrderItems((prevItems) => {
				const itemIndex = prevItems.findIndex((item) => item.id === product.id);
				if (itemIndex > -1) {
					// Atualiza item existente
					const updatedItems = [...prevItems];
					updatedItems[itemIndex] = newOrderItemData;
					return updatedItems;
				} else {
					// Adiciona novo item
					return [...prevItems, newOrderItemData];
				}
			});
            console.log(`Estado local atualizado. Item '${product.name}' com quantidade ${newQuantity}.`);

		} catch (error) {
			console.error(`Erro ao adicionar/atualizar item ${product.id} no pedido ${orderId}:`, error);
			alert(`Erro ao adicionar ${product.name}. Tente novamente.`);
		}
	};

	const addManualEntry = async () => {
		if (!selectedItem.trim() || selectedUnitPrice <= 0 || selectedQuantity <= 0) {
			alert("Para adicionar item manual, preencha:\n- Nome do item (não vazio)\n- Quantidade (maior que 0)\n- Preço Unitário (maior que 0).");
			return;
		}

		let orderId = currentOrderId;
		if (!orderId) {
            console.log("Nenhum pedido ativo para item manual. Tentando criar um novo...");
			const newId = await createNewOrder();
			if (!newId) {
                console.error("Falha ao criar novo pedido em addManualEntry. Abortando.");
                return;
            }
            orderId = newId;
            console.log("Novo pedido criado implicitamente para item manual:", orderId);
		}

        // Garante que temos um ID válido
        if (!orderId) {
             console.error("ID do pedido ainda é nulo após tentativa de criação. Abortando addManualEntry.");
             alert("Erro inesperado ao obter ID do pedido.");
             return;
        }

		const newItemId = `manual_${Date.now()}`; // ID único baseado no timestamp
		const newOrderItem: OrderItem = {
			id: newItemId,
			name: capitalizeFirstLetter(selectedItem.trim()), // Usa o nome capitalizado e sem espaços extras
			quantity: selectedQuantity,
			unitPrice: selectedUnitPrice,
			total: selectedQuantity * selectedUnitPrice,
			category: "Manual",
            // Pega dados do cliente do estado atual
            customerName: customerName,
            customerAddress: customerAddress,
            customerPhone: customerPhone.replace(/\D/g, ''),
		};

		const itemRef = ref(database, `pedidos/${orderId}/itens/${newItemId}`);

		try {
            console.log(`Adicionando item manual ${newItemId} ao pedido ${orderId}...`);
            await set(itemRef, newOrderItem); // Salva no Firebase
			setOrderItems((prevItems) => [...prevItems, newOrderItem]); // Adiciona ao estado local
            console.log("Item manual adicionado com sucesso:", newOrderItem.name);

            // Limpa SOMENTE os campos de entrada manual após adicionar
            setSelectedItem("");
            setSelectedUnitPrice(0);
            setSelectedQuantity(1);

        } catch (error) {
            console.error("Erro detalhado ao salvar item manual no Firebase:", error);
            alert("Erro ao salvar o item manual. Verifique o console e tente novamente.");
        }
	};

    // Atualiza quantidade de um item existente na tabela
	const updateQuantity = async (id: string, newQuantity: number) => {
		if (!currentOrderId) {
			console.warn("Tentativa de atualizar quantidade sem pedido ativo.");
			alert("Nenhum pedido ativo para atualizar quantidade.");
			return;
		}
        // Valida a quantidade (não pode ser negativa)
        const validQuantity = Math.max(0, isNaN(newQuantity) ? 0 : newQuantity);
        console.log(`Atualizando quantidade do item ${id} para ${validQuantity}`);


		const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error(`Item ${id} não encontrado no estado local para atualizar quantidade.`);
            return;
        }

        const itemToUpdate = { ...orderItems[itemIndex] }; // Cria cópia
        itemToUpdate.quantity = validQuantity;
        itemToUpdate.total = validQuantity * itemToUpdate.unitPrice; // Recalcula total

        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
		try {
            // Usa 'update' para modificar apenas quantidade e total no Firebase
            console.log(`Enviando atualização para Firebase: { quantity: ${validQuantity}, total: ${itemToUpdate.total} }`);
            await update(itemRef, { quantity: itemToUpdate.quantity, total: itemToUpdate.total });

            // Atualiza o estado local
            setOrderItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? itemToUpdate : item
                )
            );
            console.log(`Quantidade do item ${id} atualizada com sucesso.`);
        } catch (error) {
            console.error(`Erro ao atualizar a quantidade do item ${id}:`, error);
            alert("Erro ao atualizar a quantidade. Tente novamente.");
            // Considerar reverter a mudança no estado local se o Firebase falhar?
        }
	};

    // Atualiza nome de um item existente na tabela
    const updateItemName = async (id: string, newName: string) => {
         if (!currentOrderId) {
             console.warn("Tentativa de atualizar nome sem pedido ativo.");
             return;
         }

        const capitalizedName = capitalizeFirstLetter(newName.trim());
        if (!capitalizedName) {
            alert("O nome do item não pode ficar vazio.");
            // Talvez recarregar o nome antigo?
            return;
        }
        console.log(`Atualizando nome do item ${id} para "${capitalizedName}"`);

        const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error(`Item ${id} não encontrado no estado local para atualizar nome.`);
            return;
        }

        const itemToUpdate = { ...orderItems[itemIndex], name: capitalizedName };

        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
        try {
            console.log(`Enviando atualização para Firebase: { name: "${capitalizedName}" }`);
            await update(itemRef, { name: capitalizedName }); // Atualiza só o nome no FB

            setOrderItems(prevItems => prevItems.map(item => item.id === id ? itemToUpdate : item));
            console.log(`Nome do item ${id} atualizado com sucesso.`);
        } catch (error) {
             console.error(`Erro ao atualizar o nome do item ${id}:`, error);
            alert("Erro ao atualizar o nome do item. Tente novamente.");
        }
    };

     // Atualiza preço unitário de um item existente na tabela
    const updateItemUnitPrice = async (id: string, valueString: string) => {
        if (!currentOrderId) {
             console.warn("Tentativa de atualizar preço unitário sem pedido ativo.");
             return;
        }

        const newUnitPrice = parseCurrency(valueString);
        console.log(`Atualizando preço unitário do item ${id}. Input: "${valueString}", Parsed: ${newUnitPrice}`);

        // Valida preço (não pode ser negativo)
        if (newUnitPrice < 0) {
             console.warn("Preço unitário inválido (negativo):", newUnitPrice);
             // Pode alertar o usuário ou simplesmente ignorar/resetar
             return;
        }

        const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error(`Item ${id} não encontrado no estado local para atualizar preço.`);
            return;
        }

        const itemToUpdate = { ...orderItems[itemIndex] };
        itemToUpdate.unitPrice = newUnitPrice; // Salva o número parseado
        itemToUpdate.total = itemToUpdate.quantity * newUnitPrice; // Recalcula o total

        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
        try {
            console.log(`Enviando atualização para Firebase: { unitPrice: ${newUnitPrice}, total: ${itemToUpdate.total} }`);
            await update(itemRef, { unitPrice: itemToUpdate.unitPrice, total: itemToUpdate.total });

             setOrderItems(prevItems => prevItems.map(item => item.id === id ? itemToUpdate : item));
             console.log(`Preço unitário do item ${id} atualizado com sucesso.`);
        } catch (error) {
             console.error(`Erro ao atualizar o preço unitário do item ${id}:`, error);
            alert("Erro ao salvar o novo preço unitário. Tente novamente.");
        }
    };


	const removeFromOrder = async (id: string) => {
		if (!currentOrderId) {
            console.warn("Tentativa de remover item sem pedido ativo.");
			alert("Nenhum pedido ativo para remover itens.");
			return;
		}

		const itemToRemove = orderItems.find(item => item.id === id);
        if (!itemToRemove) {
             console.warn(`Tentativa de remover item ${id} que não está no estado local.`);
             return; // Item já não existe localmente
        }

        // Confirmação com o usuário
        const confirmation = window.confirm(`Tem certeza que deseja remover o item "${itemToRemove.name}" do pedido?`);
        if (!confirmation) {
            console.log("Remoção do item cancelada pelo usuário.");
            return;
        }

		console.log(`Tentando remover item ${id} do pedido ${currentOrderId}...`);
		const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);

		try {
            await remove(itemRef); // Remove do Firebase
			console.log(`Item ${id} removido com sucesso do Firebase.`);
			// Atualiza o estado local filtrando o item removido
            setOrderItems((prevItems) => prevItems.filter((item) => item.id !== id));
            console.log(`Item ${id} removido do estado local.`);
        } catch (error) {
            console.error(`Erro ao remover o item ${id} do Firebase:`, error);
            alert("Erro ao remover o item. Tente novamente.");
        }
	};

	const removeAllItems = async () => {
		if (!currentOrderId) {
             console.warn("Tentativa de limpar itens sem pedido ativo.");
			alert("Nenhum pedido ativo para limpar os itens.");
			return;
		}
        if (orderItems.length === 0) {
            alert("O pedido já está vazio.");
            return;
        }

        // Confirmação com o usuário
		const confirmation = window.confirm("Tem certeza que deseja remover TODOS os itens deste pedido?\n(Os dados do cliente e pagamento serão mantidos)");
        if (!confirmation) {
             console.log("Limpeza de itens cancelada pelo usuário.");
             return;
        }

		try {
			console.log(`Removendo todos os itens do pedido ${currentOrderId}...`);
			const itemsRef = ref(database, `pedidos/${currentOrderId}/itens`);
			// Define o nó 'itens' como null para remover todos os filhos de uma vez
            await set(itemsRef, null);

			console.log(`Todos os itens removidos com sucesso do Firebase para o pedido ${currentOrderId}.`);
			setOrderItems([]); // Limpa o estado local de itens
			alert("Todos os itens foram removidos com sucesso!");
		} catch (error) {
			console.error(`Erro ao remover todos os itens do pedido ${currentOrderId}:`, error);
			alert("Erro ao remover os itens. Tente novamente.");
		}
	};


	// --- Navegação ---

	// Salva os dados finais do pedido e navega para a visualização
	const goToOrderView = async () => {
        console.log("Iniciando processo de finalização e navegação para OrderView...");
        // 1. Verifica se há um pedido ativo
		if (!currentOrderId) {
            console.warn("Tentativa de finalizar sem pedido ativo.");
			alert("Não há um pedido ativo para finalizar.\nCrie um 'Novo Pedido' ou selecione um pedido existente.");
			return;
		}

        // 2. Verifica se há itens no pedido
        if (orderItems.length === 0) {
            console.warn("Tentativa de finalizar pedido vazio.");
            alert("Não é possível finalizar um pedido vazio.\nAdicione itens primeiro.");
            return;
        }

        // 3. Validação (opcional, mas recomendada) dos dados do cliente
        const phoneDigits = customerPhone.replace(/\D/g, '');
        if (!customerName.trim() || !customerAddress.trim() || phoneDigits.length < 10) { // Verifica telefone com 10 ou 11 dígitos
             const proceed = window.confirm("Os dados do cliente (Nome, Endereço, Telefone) parecem incompletos ou inválidos.\nDeseja continuar mesmo assim?");
            if (!proceed) {
                console.log("Finalização cancelada pelo usuário devido a dados incompletos.");
                return; // Para a execução se o usuário cancelar
            }
             console.warn("Prosseguindo com dados do cliente incompletos.");
        }

		// 4. Prepara os dados finais para atualização no Firebase
        const parsedPaymentValue = parseCurrency(paymentValue); // Converte valor pago para número
        const calculatedTotalPrice = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);

        console.log("Preparando dados para salvar no Firebase:", {
            customerName, customerAddress, phoneDigits, paymentMethod, parsedPaymentValue, calculatedTotalPrice
        });

		try {
			// 5. Referência para o nó RAIZ do pedido atual
			const orderRef = ref(database, `pedidos/${currentOrderId}`);

			// 6. Objeto com os campos a serem atualizados/confirmados no Firebase
			const updates = {
				customerName: customerName.trim(),
				customerAddress: customerAddress.trim(),
				customerPhone: phoneDigits, // Salva apenas dígitos
				paymentMethod: paymentMethod,
				paymentValue: parsedPaymentValue,
                totalOrderValue: calculatedTotalPrice, // Salva o total final calculado
                lastUpdatedAt: new Date().toISOString(), // Atualiza timestamp da última modificação
                // Poderia atualizar o status aqui também, se necessário. Ex: status: 'confirmado'
			};

			// 7. Executa a operação de ATUALIZAÇÃO no Firebase
            console.log(`Atualizando dados do pedido ${currentOrderId} no Firebase...`);
			await update(orderRef, updates);
			console.log("Dados finais do pedido atualizados no Firebase com sucesso.");

			// 8. Navega para a tela de visualização APÓS o sucesso da atualização
            console.log("Navegando para /OrderView com os parâmetros...");
			router.push({
				pathname: "/OrderView", // Confirme o caminho da rota
				params: {
                    // Passa os dados necessários para a próxima tela
					orderId: currentOrderId,
					// Não precisa passar todos os dados, OrderView buscará pelo ID.
                    // Passar o ID é suficiente.
				},
			});
            // Opcional: Limpar o estado local após navegar? Ou deixar OrderView buscar?
            // clearOrderState(); // Cuidado: isso limparia antes de OrderView carregar
            // setCurrentOrderId(null); // Isso desativaria o pedido atual

		} catch (error) {
            // 9. Trata erros durante a atualização no Firebase
			console.error(`Erro ao atualizar dados finais do pedido ${currentOrderId} no Firebase:`, error);
			alert("Ocorreu um erro ao salvar as informações finais do pedido.\nVerifique sua conexão e tente novamente.");
		}
	};


	const goToOrders = () => {
        console.log("Navegando para /Orders");
		router.push("/Orders"); // Ajuste o caminho se necessário
	};
	const goToQuiz = () => {
         console.log("Navegando para /Quiz");
		router.push("/Quiz"); // Ajuste o caminho se necessário
	};

	// --- Handlers de Input (Atualizam Estado Local) ---

    // Handler genérico para inputs de quantidade (item manual)
	const handleQuantityChange = (
		setter: React.Dispatch<React.SetStateAction<number>>,
		value: string
	) => {
		const parsedValue = parseInt(value, 10);
        // Permite campo vazio (representa 0), não permite negativo
		setter(isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue);
	};

    // Handler para input de Valor Pago (formata como moeda BRL enquanto digita)
	const handlePaymentValueChange = (text: string) => {
        // Remove tudo que não for dígito
		let cleanedValue = text.replace(/\D/g, '');
        if (cleanedValue === '') {
            setPaymentValue(''); // Permite limpar o campo
            return;
        }
        // Converte para número (centavos)
        const numberValue = parseInt(cleanedValue, 10);
        // Formata como moeda BRL (sem o R$)
        const formattedValue = (numberValue / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
		setPaymentValue(formattedValue); // Atualiza estado com valor formatado (string)
	};

    // Handlers para dados do cliente com useCallback para otimização leve
    const handleCustomerNameChange = useCallback((text: string) => {
        setCustomerName(capitalizeFirstLetter(text));
    }, []);

    const handleCustomerAddressChange = useCallback((text: string) => {
        setCustomerAddress(capitalizeFirstLetter(text));
    }, []);

    const handleCustomerPhoneChange = useCallback((text: string) => {
        setCustomerPhone(formatPhoneNumber(text)); // Formata enquanto digita
    }, []);

    // Handler para nome do item manual
    const handleSelectedItemChange = useCallback((text: string) => {
        setSelectedItem(text); // Capitaliza ao adicionar, não ao digitar
    }, []);

     // Handler para o Preço Unitário do item manual
    const handleSelectedUnitPriceChange = useCallback((text: string) => {
        // Remove caracteres não numéricos, exceto vírgula
        const cleaned = text.replace(/[^\d,]/g, '');
        // Permite apenas uma vírgula
        const parts = cleaned.split(',');
        let valueToParse = cleaned;
        if (parts.length > 2) {
            valueToParse = parts[0] + ',' + parts.slice(1).join('');
        }
        // Atualiza o estado com o valor parseado (número)
        setSelectedUnitPrice(parseCurrency(valueToParse));
        // Não formata o input aqui, formata apenas na exibição se necessário
        // ou usa um estado separado para o input se a formatação for complexa
    }, []);


	// --- Cálculos Derivados do Estado ---
	const totalPrice = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);

	// Calcula Troco ou Valor Faltante
	const calculateChange = () => {
        const parsedPayment = parseCurrency(paymentValue); // Usa o parseCurrency correto
        // Retorna a diferença (positiva para troco, negativa para falta)
		return parsedPayment - totalPrice;
	};
	const changeAmount = calculateChange();


	// --- Renderização JSX ---
	return (
		<Container>
			<Title>Lançamento do Pedido</Title>
            {/* Mostra o ID do pedido ativo, se houver */}
            {currentOrderId && (
                 <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', marginBottom: '15px', textAlign: 'center' }}>
                     Editando Pedido ID: <strong style={{color: '#333'}}>{currentOrderId}</strong>
                 </p>
            )}

            {/* Botões de Ação Principais */}
			<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* Botão Novo Pedido */}
                <NextButton onClick={createNewOrder} style={{ backgroundColor: '#4CAF50', minWidth: '150px' }}>
                    <NextButtonText>Novo Pedido</NextButtonText>
                </NextButton>
                {/* Botão Pedidos Anteriores */}
                <NextButton onClick={goToOrders} style={{ backgroundColor: '#007BFF', minWidth: '150px' }}>
                    <NextButtonText>Pedidos Anteriores</NextButtonText>
                </NextButton>
                 {/* Botão Questionário */}
                <NextButton onClick={goToQuiz} style={{ backgroundColor: '#9C27B0', minWidth: '150px' }}>
                    <NextButtonText>Fazer Questionário</NextButtonText>
                </NextButton>
            </div>


			{/* Seleção de Categorias */}
            {categories.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Categorias</h2>
                    <CategoryContainer>
                        {/* Botão Todas */}
                        <CategoryButton
                            selected={selectedCategory === null}
                            onClick={() => setSelectedCategory(null)}
                            // Aplica estilo diretamente para sobrescrever se necessário
                            style={{
                                backgroundColor: selectedCategory === null ? '#E91E63' : '#f0f0f0',
                                color: selectedCategory === null ? '#fff' : '#333',
                                borderColor: selectedCategory === null ? '#E91E63' : '#ccc'
                            }}
                         >
                             <CategoryText style={{color: 'inherit'}}>Todas</CategoryText> {/* Garante herança da cor */}
                        </CategoryButton>
                        {/* Botões por Categoria */}
                        {categories.map((category) => (
                            <CategoryButton
                                key={category}
                                selected={selectedCategory === category}
                                onClick={() => setSelectedCategory(category)}
                            >
                                <CategoryText>{category}</CategoryText>
                            </CategoryButton>
                        ))}
                    </CategoryContainer>
                </div>
            )}

            {/* Seleção Rápida de Produtos */}
             <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Adicionar Produto Rápido</h2>
                <CategoryContainer>
                    {/* Combina produtos fixos e do Firebase */}
                    {[...fixedProducts, ...products]
                         // Remove duplicatas por ID (prioriza o do Firebase se ID for igual)
                         .reduce((acc, current) => {
                            if (!acc.find(item => item.id === current.id)) {
                                acc.push(current);
                            }
                            return acc;
                         }, [] as Product[])
                        // Filtra por categoria selecionada (ou mostra todos se null)
                        .filter(p => selectedCategory === null || p.category === selectedCategory)
                        // Ordena alfabeticamente por nome (opcional)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((product) => (
                        <CategoryButton // Usando CategoryButton estilizado como base
                            key={product.id} // Usa ID como chave única
                            onClick={() => addToOrder(product)}
                            title={`Adicionar ${product.name} - R$ ${formatCurrency(product.price)}`}
                            // Estilo específico para produtos
                            style={{
                                flexBasis: '180px', // Um pouco mais largo
                                height: 'auto',    // Altura automática
                                padding: '10px 15px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: '#fff', // Fundo branco para produtos
                                border: '1px solid #ddd',
                                boxShadow: '2px 2px 5px rgba(0,0,0,0.05)'
                             }}
                        >
                             <ProductText style={{ fontWeight: 500, fontSize: '15px', margin: 0, color: '#333' }}>{product.name}</ProductText>
                             <ProductText style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0 0 0', color: '#E91E63' }}>R$ {formatCurrency(product.price)}</ProductText>
                        </CategoryButton>
                    ))}
                     {/* Mensagem se nenhum produto for encontrado para a categoria */}
                     {[...fixedProducts, ...products].filter(p => selectedCategory === null || p.category === selectedCategory).length === 0 && (
                        <p style={{width: '100%', textAlign: 'center', color: '#777'}}>Nenhum produto encontrado {selectedCategory ? `na categoria "${selectedCategory}"` : ''}.</p>
                     )}
                </CategoryContainer>
            </div>


			{/* Dados do Cliente */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Dados do Cliente</h2>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerNameInput" style={{ minWidth: '80px', textAlign: 'right', fontWeight: 500 }}>Nome:</label>
                    <TableInput
                        id="customerNameInput"
                        type="text"
                        placeholder="Nome completo do cliente"
                        value={customerName}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                        style={{ flexGrow: 1, textAlign: 'left' }} // Alinha à esquerda
                        required // Adiciona validação básica HTML5
                    />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerAddressInput" style={{ minWidth: '80px', textAlign: 'right', fontWeight: 500 }}>Endereço:</label>
                    <TableInput
                        id="customerAddressInput"
                        type="text"
                        placeholder="Rua, Número, Bairro, Referência..."
                        value={customerAddress}
                        onChange={(e) => handleCustomerAddressChange(e.target.value)}
                         style={{ flexGrow: 1, textAlign: 'left' }}
                         required
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerPhoneInput" style={{ minWidth: '80px', textAlign: 'right', fontWeight: 500 }}>Telefone:</label>
                    <TableInput
                        id="customerPhoneInput"
                        type="tel" // Tipo 'tel' para semântica e teclado mobile
                        placeholder="(XX) XXXXX-XXXX"
                        value={customerPhone}
                        onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                        maxLength={15} // (XX) XXXXX-XXXX
                         style={{ flexGrow: 1, textAlign: 'left' }}
                         required
                         pattern="\(\d{2}\)\s\d{4,5}-\d{4}" // Padrão de validação HTML5 (opcional)
                         title="Formato esperado: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
                    />
                </div>
            </div>

            {/* Adicionar Item Manualmente */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fff' }}>
                 <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Adicionar Item Manualmente</h2>
                <TableHeader style={{ alignItems: 'flex-end', gap: '15px', flexWrap: 'wrap' }}> {/* Permite quebrar linha em telas menores */}
                    {/* Item */}
                    <div style={{flex: '1 1 250px'}}> {/* Base flexível, cresce */}
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>Item</span>
                        <TableInput
                            type="text"
                            placeholder="Nome do item ou serviço"
                            value={selectedItem}
                            onChange={(e) => handleSelectedItemChange(e.target.value)}
                            style={{ textAlign: 'left' }}
                        />
                    </div>
                     {/* Quantidade */}
                    <div style={{flex: '0 1 80px'}}> {/* Não cresce, base fixa */}
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>Qtde</span>
                        <TableInput
                            type="number"
                            placeholder="Qtde"
                            value={selectedQuantity === 0 ? '' : selectedQuantity.toString()} // Mostra vazio se 0, converte para string
                            onChange={(e) => handleQuantityChange(setSelectedQuantity, e.target.value)}
                            min="1" // Mínimo 1 para adicionar?
                            style={{ textAlign: 'center' }}
                        />
                    </div>
                    {/* Preço Unitário */}
                    <div style={{flex: '0 1 120px'}}>
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>Unit. (R$)</span>
                        <TableInput
                            type="text" // Permite digitar vírgula
                            inputMode="decimal" // Teclado numérico em mobile
                            placeholder="0,00"
                            // Exibe o valor formatado apenas se houver valor > 0
                            value={selectedUnitPrice > 0 ? formatCurrency(selectedUnitPrice) : ''}
                            // Chama o handler que parseia a string para número
                            onChange={(e) => handleSelectedUnitPriceChange(e.target.value)}
                            style={{ textAlign: 'right' }}
                        />
                    </div>
                    {/* Total Calculado */}
                    <div style={{flex: '0 1 120px'}}>
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>Total (R$)</span>
                        {/* Mostra total calculado, não é um input */}
                        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#eee', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '16px', fontWeight: 'bold' }}>
                           {formatCurrency(manualItemTotal)}
                        </div>
                    </div>
                     {/* Botão Adicionar */}
                     <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}> {/* Não encolhe, alinha na base */}
                        <NextButton
                           onClick={addManualEntry}
                           style={{ padding: '8px 15px', fontSize: '14px', minHeight: '38px', marginBottom: '0' }} // Ajusta altura e margem
                           title="Adicionar este item ao pedido"
                        >
                            <NextButtonText>+ Adicionar</NextButtonText>
                        </NextButton>
                    </div>
                </TableHeader>
            </div>


			{/* Tabela de Itens do Pedido Atual */}
            <div style={{ margin: '30px 0' }}>
                 <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Itens no Pedido Atual</h2>
                {orderItems.length > 0 ? (
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Cabeçalho Tabela */}
                        <TableHeader style={{ background: '#f2f2f2', padding: '10px', borderBottom: '1px solid #ddd', gap: '10px', marginBottom: 0, flexWrap: 'nowrap' }}>
                            <TableCell style={{ flex: 3, textAlign: 'left', fontWeight: 'bold', paddingLeft: '5px' }}>Item</TableCell>
                            <TableCell style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>Qtde</TableCell>
                            <TableCell style={{ flex: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Unit. (R$)</TableCell>
                            <TableCell style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold', paddingRight: '5px' }}>Total (R$)</TableCell>
                            <TableCell style={{ flex: 0.5, textAlign: 'center', fontWeight: 'bold' }}>Ação</TableCell>
                        </TableHeader>
                        {/* Corpo Tabela */}
                        <TableBody style={{ maxHeight: '400px', overflowY: 'auto', marginTop: 0, background: '#fff' }}>
                            {orderItems.map((item) => (
                                <TableRow key={item.id} style={{ borderBottom: '1px solid #eee', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                                    {/* Nome Item (Editável) */}
                                    <TableCell style={{ flex: 3 }}>
                                        <TableInput
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItemName(item.id, e.target.value)}
                                            style={{ border: 'none', background: 'transparent', padding: '5px', width: '100%', textAlign: 'left', fontSize: '15px' }}
                                            title="Clique para editar o nome"
                                        />
                                    </TableCell>
                                    {/* Quantidade (Editável) */}
                                    <TableCell style={{ flex: 1, textAlign: 'center' }}>
                                        <TableInput
                                            type="number"
                                            value={item.quantity.toString()} // Input type number espera string
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                                            min="0" // Permite zerar quantidade (para talvez remover depois?)
                                            style={{ width: '65px', padding: '5px', fontSize: '15px' }}
                                            title="Clique para editar a quantidade"
                                        />
                                    </TableCell>
                                     {/* Preço Unitário (Editável) */}
                                     <TableCell style={{ flex: 1.5, textAlign: 'center' }}>
                                            <TableInput
                                                type="text" // text para formatação/digitação com vírgula
                                                inputMode="decimal"
                                                // O value continua mostrando formatado, a mágica está no onChange/parseCurrency
                                                value={formatCurrency(item.unitPrice)}
                                                // A função updateItemUnitPrice usa parseCurrency, que já lida com "122,58"
                                                onChange={(e) => updateItemUnitPrice(item.id, e.target.value)}
                                                // AUMENTE A LARGURA AQUI: de 90px para 120px ou mais, conforme necessário
                                                style={{ width: '120px', padding: '5px', textAlign: 'right', fontSize: '15px' }}
                                                title="Clique para editar o preço unitário (ex: 122,58)"
                                            />
                                        </TableCell>
                                    {/* Total Item (Calculado) */}
                                    <TableCell style={{ flex: 1.5, textAlign: 'right', padding: '5px 10px', fontWeight: '500', fontSize: '15px' }}>
                                        {formatCurrency(item.total)}
                                    </TableCell>
                                    {/* Botão Remover */}
                                    <TableCell style={{ flex: 0.5, textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeFromOrder(item.id)}
                                            title="Remover este item"
                                            style={{ background: 'none', border: 'none', color: '#E91E63', cursor: 'pointer', fontSize: '24px', padding: 0, lineHeight: 1 }}
                                        >
                                            × {/* X mais elegante */}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         {/* Rodapé Tabela */}
                        <TableFooter style={{ background: '#f2f2f2', padding: '15px 10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 0 }}>
                            {/* Botão Limpar Itens */}
                            <button
                                onClick={removeAllItems}
                                title="Remover todos os itens do pedido"
                                disabled={orderItems.length === 0}
                                style={{
                                     background: orderItems.length > 0 ? '#ff5252' : '#aaa',
                                     color: 'white',
                                     border: 'none',
                                     padding: '8px 12px',
                                     borderRadius: '4px',
                                     cursor: orderItems.length > 0 ? 'pointer' : 'not-allowed',
                                     fontSize: '14px',
                                     opacity: orderItems.length === 0 ? 0.6 : 1,
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '5px'
                                }}
                             >
                                 {/* Ícone de lixeira */} Limpar Itens
                            </button>
                            {/* Total Geral */}
                            <TotalText style={{ margin: 0, fontSize: '18px' }}>Total do Pedido: R$ {formatCurrency(totalPrice)}</TotalText>
                        </TableFooter>
                    </div>
                ) : (
                     // Mensagem se não houver itens
                    <p style={{ textAlign: 'center', color: '#777', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px', background: '#fafafa' }}>
                        Nenhum item adicionado a este pedido ainda. Use os botões acima ou adicione manualmente.
                    </p>
                )}
            </div>


            {/* Seção de Pagamento */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                 <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Pagamento</h2>
                {/* Forma de Pagamento */}
                <div style={{ marginBottom: '15px' }}>
                    <span style={{ marginRight: '15px', fontWeight: '500' }}>Forma:</span>
                    {['Dinheiro', 'Pix', 'Cartão Débito', 'Cartão Crédito'].map(method => ( // Adiciona mais opções se quiser
                         <label key={method} style={{ marginRight: '20px', cursor: 'pointer', fontSize: '15px' }}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method}
                                checked={paymentMethod === method}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ marginRight: '5px', verticalAlign: 'middle' }}
                            /> {method}
                        </label>
                    ))}
                </div>

                {/* Valor Pago */}
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="paymentValueInput" style={{ minWidth: '90px', fontWeight: '500', textAlign: 'right' }}>Valor Pago:</label>
                     <TableInput
                        id="paymentValueInput"
                        type="text" // Permite formatação
                        inputMode="decimal" // Teclado numérico
                        placeholder="0,00"
                        value={paymentValue} // Mostra estado formatado (string)
                        onChange={(e) => handlePaymentValueChange(e.target.value)} // Handler que formata e atualiza
                        style={{ width: '150px', textAlign: 'right' }} // Largura fixa, alinha à direita
                    />
                </div>

                {/* Exibição do Troco ou Falta */}
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', fontWeight: 'bold', fontSize: '18px', textAlign: 'right' }}>
                    {changeAmount >= 0 ? (
                        <span style={{ color: '#28a745' }}>Troco: R$ {formatCurrency(changeAmount)}</span>
                    ) : (
                        <span style={{ color: '#dc3545' }}>Falta: R$ {formatCurrency(Math.abs(changeAmount))}</span>
                    )}
                </div>
            </div>

			{/* Botão Finalizar/Próximo */}
			<NextButton
                onClick={goToOrderView}
                // Desabilita se não houver ID ou itens
                disabled={!currentOrderId || orderItems.length === 0}
                title={!currentOrderId ? "Crie um 'Novo Pedido' primeiro" : (orderItems.length === 0 ? "Adicione itens ao pedido para poder finalizar" : "Finalizar e ir para visualização")}
                style={{
                    marginTop: '30px',
                    width: '100%',
                    padding: '18px',
                    fontSize: '18px',
                    // Usa a cor primária definida nos estilos ou um azul padrão
                    backgroundColor: (!currentOrderId || orderItems.length === 0) ? '#aaa' : '#007BFF',
                    cursor: (!currentOrderId || orderItems.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (!currentOrderId || orderItems.length === 0) ? 0.6 : 1,
                    border: 'none', // Garante que não tem borda do browser
                 }}
             >
				<NextButtonText>FINALIZAR E VISUALIZAR PEDIDO</NextButtonText>
			</NextButton>

		</Container>
	);
}