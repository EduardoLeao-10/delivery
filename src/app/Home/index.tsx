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
// --- CORREÇÃO: Importar 'update' ---
import { ref, set, push, get, remove, update } from "firebase/database";
import { Product } from "../types";
import { TextInput as ReactNativeTextInput } from 'react-native'; // Mantém o TextInput do RN

// --- Interface para itens do pedido ---
interface OrderItem {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
	category: string;
	// Estes campos no item são redundantes se já existem no pedido principal
	customerName: string;
	customerAddress: string;
	customerPhone: string;
}

// --- Funções Utilitárias ---
const capitalizeFirstLetter = (str: string): string => {
	if (!str) return ""; // Garante que não falhe com string vazia
	return str
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

const formatPhoneNumber = (value: string): string => {
    if (!value) return "";
	const cleanedValue = value.replace(/\D/g, '');
	const match = cleanedValue.match(/^(\d{2})(\d{5})(\d{4})$/); // Prioriza 9 dígitos no celular
	if (match) {
		return `(${match[1]}) ${match[2]}-${match[3]}`;
	}
    const matchShort = cleanedValue.match(/^(\d{2})(\d{4})(\d{4})$/); // Tenta 8 dígitos
    if (matchShort) {
        return `(${matchShort[1]}) ${matchShort[2]}-${matchShort[3]}`;
    }
    // Retorna o valor parcialmente formatado ou limpo se não corresponder
	return value;
};

const formatCurrency = (value: number): string => {
	if (isNaN(value)) return "0,00"; // Retorna '0,00' se valor for NaN
	return value.toLocaleString("pt-BR", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

// Função para converter string formatada (ex: "120,21") para número (ex: 120.21)
const parseCurrency = (value: string): number => {
    if (!value) return 0;
	// Remove todos os caracteres não numéricos, exceto a vírgula decimal
	const cleanedValue = value.replace(/[^\d,]/g, '');
    // Substitui a vírgula decimal por ponto para o parseFloat
    const numericString = cleanedValue.replace(',', '.');
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
	const [selectedItem, setSelectedItem] = useState<string>("");
	const [selectedUnitPrice, setSelectedUnitPrice] = useState<number>(0);
	const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
	const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

	// Estados do Cliente
	const [customerName, setCustomerName] = useState<string>("");
	const [customerAddress, setCustomerAddress] = useState<string>("");
	const [customerPhone, setCustomerPhone] = useState<string>("");

	// Estados do Pagamento
	const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
	const [paymentValue, setPaymentValue] = useState<string>(''); // Mantido como string para formatação de input

	// Produtos fixos (Exemplo)
	const [fixedProducts] = useState<Product[]>([
        { id: "1", name: "Curriculo", category: "Trabalho", price: 15.0 },
        { id: "2", name: "Curriculo PDF", category: "Trabalho", price: 5.0 },
        { id: "3", name: "Xerox", category: "Impressão", price: 1.0 },
        { id: "4", name: "Imp Curriculo 1f", category: "Impressão", price: 3.0 },
        { id: "5", name: "Imp Curriculo 2f", category: "Impressão", price: 4.0 },
        { id: "6", name: "Musica Selecionar", category: "Musica", price: 2.0 },
        { id: "7", name: "Detran", category: "Veiculo", price: 10.0 },
	]);

	const router = useRouter();

    // Calcula Total do item manual (Não precisa de estado separado)
	const manualItemTotal = selectedQuantity * selectedUnitPrice;

	// --- Effects ---

	// Busca produtos do Firebase (apenas uma vez na montagem)
	useEffect(() => {
		const fetchData = async () => {
			try {
				const dbRef = ref(database, "menu");
				const snapshot = await get(dbRef);
				let fetchedProducts: Product[] = [];
				if (snapshot.exists()) {
					const data: Record<string, Product> = snapshot.val();
					fetchedProducts = Object.entries(data).map(([id, item]) => ({
						...item,
						id,
					}));
					setProducts(fetchedProducts);
					console.log("Produtos carregados do Firebase.");
				} else {
					console.log("Nenhum produto encontrado no nó 'menu' do Firebase. Usando apenas fixos.");
                    setProducts([]); // Limpa produtos do Firebase se não encontrar
				}
                // Combina categorias dos produtos fixos e do Firebase
                const combinedProducts = [...fixedProducts, ...fetchedProducts];
				const uniqueCategories = [...new Set(combinedProducts.map((item) => item.category))];
                setCategories(uniqueCategories);

			} catch (error) {
				console.error("Erro ao buscar produtos do Firebase:", error);
                // Em caso de erro, usa apenas categorias dos produtos fixos
                const fixedCategories = [...new Set(fixedProducts.map((item) => item.category))];
                setCategories(fixedCategories);
			}
		};
		fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Dependência vazia garante que rode só uma vez

    // Busca dados de um pedido existente se um ID for definido
    // (Útil se você implementar a seleção de pedidos anteriores para edição)
	useEffect(() => {
		const fetchOrderData = async () => {
			if (!currentOrderId) {
                // Limpa o estado se não houver pedido ativo (ou ao criar novo)
                clearOrderState();
                return;
            }

			const orderRef = ref(database, `pedidos/${currentOrderId}`);
			try {
                const snapshot = await get(orderRef);
                if (snapshot.exists()) {
                    const orderData = snapshot.val();
                    console.log("Carregando dados do pedido:", currentOrderId, orderData);
                    // Preenche os campos com os dados do pedido existente
                    setCustomerName(orderData.customerName || "");
                    setCustomerAddress(orderData.customerAddress || "");
                    // Formata o telefone ao carregar do DB (onde está salvo sem formatação)
                    setCustomerPhone(orderData.customerPhone ? formatPhoneNumber(orderData.customerPhone) : "");
                    setPaymentMethod(orderData.paymentMethod || "Dinheiro");
                    // Formata o valor pago ao carregar
                    setPaymentValue(orderData.paymentValue ? formatCurrency(orderData.paymentValue) : '');
                    // Carrega os itens do pedido
                    setOrderItems(orderData.itens ? Object.values(orderData.itens) as OrderItem[] : []);
                } else {
                    console.warn("Pedido com ID", currentOrderId, "não encontrado no Firebase.");
                    // Talvez limpar o ID se não for encontrado?
                    // setCurrentOrderId(null);
                }
            } catch (error) {
                console.error("Erro ao buscar dados do pedido:", error);
                alert("Erro ao carregar dados do pedido anterior.");
            }
		};

		fetchOrderData();
        // Roda sempre que currentOrderId mudar
        // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentOrderId]);

	// --- Funções de Manipulação de Estado Local ---
    const clearOrderState = () => {
        setOrderItems([]);
        setCustomerName("");
        setCustomerAddress("");
        setCustomerPhone("");
        setPaymentMethod("Dinheiro");
        setPaymentValue("");
        setSelectedItem("");
        setSelectedUnitPrice(0);
        setSelectedQuantity(1);
        setSelectedCategory(null);
        console.log("Estado do pedido local limpo.");
    }

	// --- Funções de Interação com Firebase ---

	const createNewOrder = async () => {
        // Não valida mais os dados do cliente aqui, pois serão salvos depois
		const pedidosRef = ref(database, "pedidos");
		const newOrderRef = push(pedidosRef); // Gera um novo ID único
		const newOrderId = newOrderRef.key;

		if (newOrderId) {
            // 1. Limpa o estado local completamente ANTES de definir o novo ID
            clearOrderState();
            // 2. Define o novo ID, o que disparará o useEffect para buscar dados (que não existirão ainda)
			setCurrentOrderId(newOrderId);

            // Pega os valores do estado atual (que acabaram de ser limpos)
            // Ou você pode definir valores padrão explícitos aqui
            const initialOrderData = {
                customerName: "", // Inicia vazio
                customerAddress: "", // Inicia vazio
                customerPhone: "", // Inicia vazio (será salvo sem formatação depois)
                paymentMethod: "Dinheiro", // Valor padrão
                paymentValue: 0, // Valor padrão numérico
                itens: {}, // Objeto vazio para itens
                createdAt: new Date().toISOString(), // Opcional: timestamp
                status: "aberto", // Opcional: status
            };

			try {
                // Salva a estrutura inicial do pedido no Firebase
                await set(newOrderRef, initialOrderData);
                alert("Novo pedido iniciado! ID: " + newOrderId);
                console.log("Novo pedido criado no Firebase com dados iniciais:", newOrderId, initialOrderData);
                return newOrderId; // Retorna o ID para uso imediato se necessário
            } catch (error) {
                console.error("Erro ao criar novo pedido no Firebase:", error);
                alert("Erro ao criar novo pedido. Tente novamente.");
                setCurrentOrderId(null); // Reseta o ID se a criação falhar
                return null;
            }

		} else {
			console.error("Falha ao obter key para novo pedido.");
            alert("Erro crítico ao gerar ID para o pedido.");
			return null;
		}
	};

	const addToOrder = async (product: Product) => {
		let orderId = currentOrderId;

		// Se não há pedido ativo, cria um implicitamente
		if (!orderId) {
            alert("Nenhum pedido ativo. Criando um novo pedido para adicionar o item.");
			orderId = await createNewOrder();
			if (!orderId) {
				// createNewOrder já mostra alerta de erro
				return; // Sai se não conseguiu criar o pedido
			}
            // createNewOrder define currentOrderId, então podemos continuar
		}

        // Usa o ID (garantido que existe neste ponto)
		const itemRef = ref(database, `pedidos/${orderId}/itens/${product.id}`);

		try {
            // Busca o item existente para atualizar a quantidade corretamente
            const existingItemSnapshot = await get(itemRef);
            let currentQuantity = 0;
            if (existingItemSnapshot.exists()) {
                currentQuantity = existingItemSnapshot.val().quantity || 0;
            }

            const newQuantity = currentQuantity + 1; // Adiciona 1 à quantidade existente
            const newTotal = newQuantity * product.price;

            // Cria o objeto do item com os dados atualizados e os dados do cliente *atuais* do estado
			const newOrderItemData: OrderItem = {
				id: product.id,
				name: product.name,
				quantity: newQuantity,
				unitPrice: product.price,
				total: newTotal,
				category: product.category,
				// Inclui dados do cliente do estado atual (serão sobrescritos na finalização)
                customerName: customerName,
                customerAddress: customerAddress,
                customerPhone: customerPhone.replace(/\D/g, ''), // Salva sem formatação
			};

            // Usa 'set' para adicionar ou sobrescrever o item específico no nó 'itens'
			await set(itemRef, newOrderItemData);

			// Atualiza o estado local para refletir a mudança na UI
			setOrderItems((prevItems) => {
				const itemIndex = prevItems.findIndex((item) => item.id === product.id);
				if (itemIndex > -1) {
					// Atualiza item existente na lista do estado
					const updatedItems = [...prevItems];
					updatedItems[itemIndex] = newOrderItemData; // Usa os dados que foram salvos
					return updatedItems;
				} else {
					// Adiciona novo item à lista do estado
					return [...prevItems, newOrderItemData];
				}
			});

			console.log(`Item '${product.name}' adicionado/atualizado para quantidade ${newQuantity}.`);

		} catch (error) {
			console.error("Erro ao adicionar/atualizar item no pedido:", error);
			alert(`Erro ao adicionar ${product.name}. Tente novamente.`);
		}
	};

	const addManualEntry = async () => {
		if (!selectedItem || selectedUnitPrice <= 0 || selectedQuantity <= 0) {
			alert("Preencha: Nome do item, Quantidade (>0) e Preço Unitário (>0).");
			return;
		}

		let orderId = currentOrderId;
		if (!orderId) {
            alert("Nenhum pedido ativo. Criando um novo pedido para adicionar o item manual.");
			orderId = await createNewOrder();
			if (!orderId) return;
		}

		const newItemId = `manual_${Date.now()}`; // ID único baseado no timestamp
		const newOrderItem: OrderItem = {
			id: newItemId,
			name: selectedItem, // Nome do estado
			quantity: selectedQuantity,
			unitPrice: selectedUnitPrice,
			total: selectedQuantity * selectedUnitPrice, // Usa o total calculado
			category: "Manual",
            // Dados do cliente do estado atual
            customerName: customerName,
            customerAddress: customerAddress,
            customerPhone: customerPhone.replace(/\D/g, ''),
		};

		const itemRef = ref(database, `pedidos/${orderId}/itens/${newItemId}`);

		try {
            await set(itemRef, newOrderItem); // Salva no Firebase
			setOrderItems((prevItems) => [...prevItems, newOrderItem]); // Adiciona ao estado local

            // Limpa os campos de entrada manual após adicionar
            setSelectedItem("");
            setSelectedUnitPrice(0);
            setSelectedQuantity(1);
            console.log("Item manual adicionado:", newOrderItem.name);
        } catch (error) {
            console.error("Erro detalhado ao salvar item manual no Firebase:", error);
            alert("Erro ao salvar o item manual. Tente novamente.");
        }
	};

    // Função para atualizar quantidade diretamente na tabela
	const updateQuantity = async (id: string, newQuantity: number) => {
		if (!currentOrderId) {
			alert("Nenhum pedido ativo para atualizar quantidade.");
			return;
		}
        if (isNaN(newQuantity) || newQuantity < 0) {
            console.warn("Quantidade inválida fornecida:", newQuantity);
            newQuantity = 0; // Define como 0 se inválido
        }

		const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error("Item não encontrado no estado local para atualizar quantidade:", id);
            return;
        }

        const itemToUpdate = { ...orderItems[itemIndex] }; // Cria cópia do item
        itemToUpdate.quantity = newQuantity;
        itemToUpdate.total = newQuantity * itemToUpdate.unitPrice;

        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
		try {
            // Usa 'update' para modificar apenas quantidade e total no Firebase
            await update(itemRef, { quantity: itemToUpdate.quantity, total: itemToUpdate.total });

            // Atualiza o estado local
            setOrderItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? itemToUpdate : item
                )
            );
            console.log(`Quantidade do item ${id} atualizada para ${newQuantity}`);
        } catch (error) {
            console.error("Erro ao atualizar a quantidade do item:", error);
            alert("Erro ao atualizar a quantidade. Tente novamente.");
            // Opcional: Reverter a mudança no estado local se o Firebase falhar?
        }
	};

    // Função para atualizar o nome diretamente na tabela
    const updateItemName = async (id: string, newName: string) => {
         if (!currentOrderId) return;

        const capitalizedName = capitalizeFirstLetter(newName); // Capitaliza

        const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) return;

        const itemToUpdate = { ...orderItems[itemIndex], name: capitalizedName };

        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
        try {
            await update(itemRef, { name: capitalizedName }); // Atualiza só o nome no FB

            setOrderItems(prevItems => prevItems.map(item => item.id === id ? itemToUpdate : item));
            console.log(`Nome do item ${id} atualizado para ${capitalizedName}`);
        } catch (error) {
             console.error("Erro ao atualizar o nome do item:", error);
            alert("Erro ao atualizar o nome do item. Tente novamente.");
        }
    };

     // Função para atualizar o preço unitário diretamente na tabela (COM console.log adicionado)
    const updateItemUnitPrice = async (id: string, valueString: string) => {
        if (!currentOrderId) return;

        // PASSO 1: Parsear a string do input para número
        const newUnitPrice = parseCurrency(valueString);

        // <<< DEBUG: Verifica o valor de entrada e o resultado do parse >>>
        console.log(`updateItemUnitPrice - Input: "${valueString}", Parsed Price: ${newUnitPrice}`);

        // Validação simples do preço parseado (não pode ser negativo)
        // A função parseCurrency já retorna 0 se for NaN, então só precisamos checar < 0
        if (newUnitPrice < 0) {
             console.warn("Preço unitário inválido ou negativo:", valueString, "->", newUnitPrice);
             // Decide o que fazer: resetar? alertar? ignorar? Por enquanto, vamos ignorar.
             return;
        }

        // Encontra o item no estado local
        const itemIndex = orderItems.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            console.error("Item não encontrado no estado local para atualizar preço:", id);
            return;
        }

        // Cria uma cópia do item e atualiza preço unitário e total
        const itemToUpdate = { ...orderItems[itemIndex] };
        itemToUpdate.unitPrice = newUnitPrice; // Salva o número parseado
        itemToUpdate.total = itemToUpdate.quantity * newUnitPrice; // Recalcula o total

        // Referência do item no Firebase
        const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);
        try {
            // PASSO 2: Atualizar no Firebase com os novos valores numéricos
            await update(itemRef, { unitPrice: itemToUpdate.unitPrice, total: itemToUpdate.total });

            // PASSO 3: Atualizar o estado local do React
             setOrderItems(prevItems => prevItems.map(item => item.id === id ? itemToUpdate : item));

             // <<< DEBUG: Confirma que a atualização foi enviada e o estado mudou >>>
             console.log(`Preço unitário do item ${id} atualizado para ${newUnitPrice} no estado e Firebase.`);
        } catch (error) {
             console.error("Erro ao atualizar o preço unitário no Firebase:", error);
            alert("Erro ao salvar o novo preço unitário. Tente novamente.");
            // Considerar reverter a mudança no estado local em caso de erro no Firebase?
        }
    };


	const removeFromOrder = async (id: string) => {
		if (!currentOrderId) {
			alert("Nenhum pedido ativo para remover itens.");
			return;
		}

		const itemToRemove = orderItems.find(item => item.id === id);
        if (!itemToRemove) return; // Item já não existe localmente

        const confirmation = window.confirm(`Tem certeza que deseja remover o item "${itemToRemove.name}"?`);
        if (!confirmation) return;


		console.log(`Tentando remover item ${id} do pedido ${currentOrderId}`);
		const itemRef = ref(database, `pedidos/${currentOrderId}/itens/${id}`);

		try {
            await remove(itemRef); // Remove do Firebase
			console.log(`Item ${id} removido com sucesso do Firebase.`);
			// Atualiza o estado local filtrando o item removido
            setOrderItems((prevItems) => prevItems.filter((item) => item.id !== id));
            console.log(`Item ${id} removido do estado local.`);
        } catch (error) {
            console.error("Erro ao remover o item do Firebase:", error);
            alert("Erro ao remover o item. Tente novamente.");
        }
	};

	const removeAllItems = async () => {
		if (!currentOrderId) {
			alert("Nenhum pedido ativo para limpar os itens.");
			return;
		}
        if (orderItems.length === 0) {
            alert("O pedido já está sem itens.");
            return;
        }

		const confirmation = window.confirm("Tem certeza que deseja remover TODOS os itens deste pedido? (Os dados do cliente serão mantidos)");
        if (!confirmation) return;

		try {
			console.log(`Removendo todos os itens do pedido ${currentOrderId}`);
			const itemsRef = ref(database, `pedidos/${currentOrderId}/itens`);
			// Define o nó 'itens' como null para remover todos os filhos de uma vez
            await set(itemsRef, null);

			console.log(`Todos os itens removidos com sucesso do Firebase.`);
			setOrderItems([]); // Limpa o estado local de itens
			// Não limpa mais os inputs do cliente/pagamento aqui
			alert("Todos os itens foram removidos com sucesso!");
		} catch (error) {
			console.error("Erro ao remover todos os itens do Firebase:", error);
			alert("Erro ao remover os itens. Tente novamente.");
		}
	};


	// --- Navegação ---

	// --- CORREÇÃO PRINCIPAL: Atualiza dados ANTES de navegar ---
	const goToOrderView = async () => {
        // 1. Verifica se há um pedido ativo (ID existe)
		if (!currentOrderId) {
			alert("Nenhum pedido ativo para finalizar. Por favor, crie um 'Novo Pedido'.");
			return;
		}

        // 2. Verifica se há itens no pedido (estado local)
        if (orderItems.length === 0) {
            alert("Não é possível finalizar um pedido vazio. Adicione itens primeiro.");
            return;
        }

        // 3. Validação dos dados do cliente (recomendado)
        if (!customerName || !customerAddress || !customerPhone.replace(/\D/g, '')) { // Verifica telefone sem formatação
             const proceed = window.confirm("Os dados do cliente (Nome, Endereço, Telefone) parecem incompletos. Deseja continuar mesmo assim?");
            if (!proceed) {
                return; // Para a execução se o usuário cancelar
            }
        }

		// 4. Prepara os dados para atualização no Firebase
        //    Pega os valores MAIS RECENTES do estado local
        const phoneUnformatted = customerPhone.replace(/\D/g, ''); // Remove formatação para salvar
        const parsedPaymentValue = parseCurrency(paymentValue); // Converte valor pago para número
        const calculatedTotalPrice = orderItems.reduce((sum, item) => sum + (item.total || 0), 0); // Recalcula o total aqui para garantir

		try {
			// 5. Referência para o nó RAIZ do pedido atual
			const orderRef = ref(database, `pedidos/${currentOrderId}`);

			// 6. Objeto contendo APENAS os campos a serem atualizados no Firebase
			const updates = {
				customerName: customerName,             // Valor atual do estado
				customerAddress: customerAddress,         // Valor atual do estado
				customerPhone: phoneUnformatted,        // Telefone sem formatação
				paymentMethod: paymentMethod,           // Método de pagamento atual
				paymentValue: parsedPaymentValue,       // Valor pago numérico
                totalOrderValue: calculatedTotalPrice,  // Salva o total calculado
                lastUpdatedAt: new Date().toISOString() // Opcional: timestamp da última atualização
			};

			// 7. Executa a operação de ATUALIZAÇÃO no Firebase
			await update(orderRef, updates);
			console.log("Dados finais do pedido atualizados no Firebase com sucesso:", currentOrderId, updates);

			// 8. Navega para a próxima tela APÓS a atualização bem-sucedida
			router.push({
				pathname: "/OrderView", // Confirme se este é o caminho correto da sua rota
				params: {
                    // Passa os dados necessários para a próxima tela
					orderId: currentOrderId,
					customerName: customerName,
					customerAddress: customerAddress,
					customerPhone: customerPhone, // Pode passar formatado para exibição
					paymentMethod: paymentMethod,
					paymentValue: String(parsedPaymentValue), // Passa como string
                    totalOrderValue: String(calculatedTotalPrice), // Passa como string
                    // Serializa os itens para passar como parâmetro (cuidado com limites de tamanho)
					orderItems: JSON.stringify(orderItems),
				},
			});

		} catch (error) {
            // 9. Trata erros que possam ocorrer durante a atualização no Firebase
			console.error("Erro ao atualizar dados finais do pedido no Firebase:", error);
			alert("Ocorreu um erro ao salvar as informações finais do pedido. Verifique sua conexão e tente novamente.");
		}
	};


	const goToOrders = () => {
		router.push("/Orders"); // Ajuste o caminho se necessário
	};
	const goToQuiz = () => {
		router.push("/Quiz"); // Ajuste o caminho se necessário
	};

	// --- Handlers de Input (Atualizam Estado Local) ---

    // Handler genérico para inputs de quantidade (usado no item manual)
	const handleQuantityChange = (
		setter: React.Dispatch<React.SetStateAction<number>>,
		value: string
	) => {
		const parsedValue = parseInt(value, 10);
        // Permite campo vazio ou define 0 se inválido, não permite negativo
		setter(value === '' ? 0 : (isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue));
	};

    // Handler para input de Valor Pago (formata enquanto digita)
	const handlePaymentValueChange = (text: string) => {
        if (text === '') {
            setPaymentValue('');
            return;
        }
		// Remove tudo que não for dígito
		let cleanedValue = text.replace(/\D/g, '');
        if (cleanedValue.length === 0) {
             setPaymentValue('');
             return;
        }

        // Converte para número (centavos) e depois para formato moeda BRL
        const numberValue = parseInt(cleanedValue, 10);
        const formattedValue = (numberValue / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

		setPaymentValue(formattedValue);
	};

    // Handlers para dados do cliente (com useCallback para otimização leve)
    const handleCustomerNameChange = useCallback((text: string) => {
        setCustomerName(capitalizeFirstLetter(text));
    }, []);

    const handleCustomerAddressChange = useCallback((text: string) => {
        setCustomerAddress(capitalizeFirstLetter(text));
    }, []);

    const handleCustomerPhoneChange = useCallback((text: string) => {
        // Só formata quando tem dígitos suficientes, permite apagar
        setCustomerPhone(formatPhoneNumber(text));
    }, []);

    // Handler para nome do item manual
    const handleSelectedItemChange = useCallback((text: string) => {
        setSelectedItem(capitalizeFirstLetter(text));
    }, []);
     // Handler para o Preço Unitário do item manual (usa parseCurrency diretamente)
    const handleSelectedUnitPriceChange = useCallback((text: string) => {
        setSelectedUnitPrice(parseCurrency(text));
    }, []);


	// --- Cálculos Derivados do Estado ---
	const totalPrice = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);

	// Calcula o Troco/Falta
	const calculateChange = () => {
        const parsedPayment = parseCurrency(paymentValue);
		// Se não houver valor pago válido, retorna o negativo do total (ou seja, falta tudo)
        if (isNaN(parsedPayment) || parsedPayment <= 0) {
			return -totalPrice;
		}
		return parsedPayment - totalPrice;
	};
	const changeAmount = calculateChange();


	// --- Renderização JSX ---
	return (
		<Container>
			<Title>Lançamento do Pedido</Title>
            {/* Mostra o ID do pedido sendo editado, se houver */}
            {currentOrderId && (
                 <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', marginBottom: '15px', textAlign: 'center' }}>
                     Editando Pedido ID: {currentOrderId}
                 </p>
            )}

            {/* Botões de Ação Principais */}
			<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* Botão Novo Pedido */}
                <NextButton onClick={createNewOrder} style={{ backgroundColor: '#4CAF50' }}>
                    <NextButtonText>Novo Pedido</NextButtonText>
                </NextButton>
                {/* Botão Pedidos Anteriores */}
                <NextButton onClick={goToOrders}>
                    <NextButtonText>Pedidos Anteriores</NextButtonText>
                </NextButton>
                 {/* Botão Questionário */}
                <NextButton onClick={goToQuiz}>
                    <NextButtonText>Fazer Questionário</NextButtonText>
                </NextButton>
            </div>


			{/* Seleção de Categorias (se houver categorias) */}
            {categories.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Categorias</h2>
                    <CategoryContainer>
                        {/* Botão Todas as Categorias */}
                        <CategoryButton
                            selected={selectedCategory === null}
                            onClick={() => setSelectedCategory(null)}
                            style={{backgroundColor: selectedCategory === null ? '#E91E63' : '#f5f5f5', color: selectedCategory === null ? '#fff' : '#333'}}
                         >
                             <CategoryText>Todas</CategoryText>
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
                    {/* Filtra produtos (fixos + firebase) pela categoria selecionada ou mostra todos */}
                    {[...fixedProducts, ...products]
                        // Filtro para evitar duplicatas se um fixo também vier do Firebase
                        .filter((product, index, self) =>
                            index === self.findIndex((p) => (p.id === product.id || p.name === product.name))
                        )
                        // Filtro por categoria selecionada
                        .filter(p => selectedCategory === null || p.category === selectedCategory)
                        .map((product) => (
                        <CategoryButton
                            key={product.id} // Usa ID como chave
                            onClick={() => addToOrder(product)}
                            title={`Adicionar ${product.name} - R$ ${formatCurrency(product.price)}`}
                            // Estilo um pouco diferente para produtos
                            style={{ flexBasis: '150px', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                        >
                             <ProductText style={{ fontWeight: 'normal', fontSize: '14px', margin: 0 }}>{product.name}</ProductText>
                             <ProductText style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0 0 0' }}>R$ {formatCurrency(product.price)}</ProductText>
                        </CategoryButton>
                    ))}
                </CategoryContainer>
            </div>


			{/* Dados do Cliente (Inputs) */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Dados do Cliente</h2>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerNameInput" style={{ minWidth: '80px', textAlign: 'right' }}>Nome:</label>
                    <TableInput
                        id="customerNameInput"
                        type="text"
                        placeholder="Nome completo"
                        value={customerName}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                        style={{ flexGrow: 1 }} // Ocupa espaço restante
                    />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerAddressInput" style={{ minWidth: '80px', textAlign: 'right' }}>Endereço:</label>
                    <TableInput
                        id="customerAddressInput"
                        type="text"
                        placeholder="Rua, Número, Bairro..."
                        value={customerAddress}
                        onChange={(e) => handleCustomerAddressChange(e.target.value)}
                         style={{ flexGrow: 1 }}
                    />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="customerPhoneInput" style={{ minWidth: '80px', textAlign: 'right' }}>Telefone:</label>
                    <TableInput
                        id="customerPhoneInput"
                        type="tel" // Tipo 'tel' ajuda em dispositivos móveis
                        placeholder="(XX) XXXXX-XXXX"
                        value={customerPhone}
                        onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                        maxLength={16} // Ajuste ex: (XX) XXXXX-XXXX
                         style={{ flexGrow: 1 }}
                    />
                </div>
            </div>

            {/* Adicionar Item Manualmente */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                 <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Adicionar Item Manualmente</h2>
                {/* Usando TableHeader para layout */}
                <TableHeader style={{ alignItems: 'flex-end', gap: '15px' }}> {/* Alinha na base e aumenta o espaço */}
                    <div style={{flex: 3}}> {/* Mais espaço para o nome */}
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Item</span>
                        <TableInput
                            type="text"
                            placeholder="Nome do item"
                            value={selectedItem}
                            onChange={(e) => handleSelectedItemChange(e.target.value)}
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Qtde</span>
                        <TableInput
                            type="number"
                            placeholder="Qtde"
                            value={selectedQuantity === 0 ? '' : selectedQuantity} // Mostra vazio se for 0
                            onChange={(e) => handleQuantityChange(setSelectedQuantity, e.target.value)}
                            min="1" // Mínimo 1 aqui? Ou permite 0?
                        />
                    </div>
                    <div style={{flex: 1.5}}>
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Unit. (R$)</span>
                        <TableInput
                            type="text" // Tipo texto para aceitar vírgula e formatação
                            inputMode="decimal" // Teclado numérico em mobile
                            placeholder="0,00"
                            value={selectedUnitPrice === 0 ? '' : formatCurrency(selectedUnitPrice)} // Formata, mostra vazio se 0
                            // Chama o handler que usa parseCurrency
                            onChange={(e) => handleSelectedUnitPriceChange(e.target.value)}
                        />
                    </div>
                    <div style={{flex: 1.5}}>
                        <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Total (R$)</span>
                        {/* Mostra total calculado, não é um input */}
                        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#eee', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                           {formatCurrency(manualItemTotal)}
                        </div>
                    </div>
                     {/* Botão de adicionar item manual */}
                     <div style={{ flexShrink: 0 }}> {/* Evita que o botão encolha */}
                        <NextButton onClick={addManualEntry} style={{ padding: '8px 15px', fontSize: '14px', marginBottom: '1px' }}>
                            <NextButtonText>+ Adicionar</NextButtonText>
                        </NextButton>
                    </div>
                </TableHeader>
            </div>


			{/* Tabela de Itens do Pedido Atual */}
            <div style={{ margin: '30px 0' }}>
                 <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Itens no Pedido Atual</h2>
                {orderItems.length > 0 ? (
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}> {/* Borda em volta da tabela */}
                        {/* Cabeçalho Tabela */}
                        <TableHeader style={{ background: '#f2f2f2', padding: '10px', borderBottom: '1px solid #ddd', gap: '10px', marginBottom: 0 }}>
                            <TableCell style={{ flex: 3, textAlign: 'left', fontWeight: 'bold' }}>Item</TableCell>
                            <TableCell style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>Qtde</TableCell>
                            <TableCell style={{ flex: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Unit. (R$)</TableCell>
                            <TableCell style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>Total (R$)</TableCell>
                            <TableCell style={{ flex: 0.5, textAlign: 'center', fontWeight: 'bold' }}>Ação</TableCell>
                        </TableHeader>
                        {/* Corpo Tabela */}
                        <TableBody style={{ maxHeight: '400px', overflowY: 'auto', marginTop: 0 }}> {/* Altura máxima e scroll */}
                            {orderItems.map((item) => (
                                <TableRow key={item.id} style={{ borderBottom: '1px solid #eee', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                                    {/* Nome do Item (Editável) */}
                                    <TableCell style={{ flex: 3 }}>
                                        <TableInput
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItemName(item.id, e.target.value)} // Atualiza nome
                                            style={{ border: 'none', background: 'transparent', padding: '5px', width: '100%', textAlign: 'left' }}
                                            title="Clique para editar o nome"
                                        />
                                    </TableCell>
                                    {/* Quantidade (Editável) */}
                                    <TableCell style={{ flex: 1, textAlign: 'center' }}>
                                        <TableInput
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                                            min="0" // Permite zerar
                                            style={{ width: '65px', padding: '5px' }}
                                            title="Clique para editar a quantidade"
                                        />
                                    </TableCell>
                                     {/* Preço Unitário (Editável) */}
                                    <TableCell style={{ flex: 1.5, textAlign: 'center' }}>
                                         <TableInput
                                            type="text" // text para formatação/digitação com vírgula
                                            inputMode="decimal"
                                            // Exibe o valor formatado do estado (número)
                                            value={formatCurrency(item.unitPrice)}
                                            // Ao mudar, chama a função que parseia a string para número e atualiza
                                            onChange={(e) => updateItemUnitPrice(item.id, e.target.value)} // Passa string
                                            style={{ width: '90px', padding: '5px' }}
                                            title="Clique para editar o preço unitário (ex: 120,21)"
                                        />
                                    </TableCell>
                                    {/* Total do Item (Calculado) */}
                                    <TableCell style={{ flex: 1.5, textAlign: 'right', padding: '5px', fontWeight: '500' }}>
                                        {formatCurrency(item.total)}
                                    </TableCell>
                                    {/* Botão Remover Item */}
                                    <TableCell style={{ flex: 0.5, textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeFromOrder(item.id)}
                                            title="Remover este item"
                                            style={{ background: 'none', border: 'none', color: '#E91E63', cursor: 'pointer', fontSize: '20px', padding: 0 }}
                                        >
                                            × {/* Ou use o ícone 🗑️ */}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         {/* Rodapé Tabela */}
                        <TableFooter style={{ background: '#f2f2f2', padding: '15px 10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 0 }}>
                             {/* Botão para remover todos os itens */}
                            <button
                                onClick={removeAllItems}
                                title="Remover todos os itens do pedido"
                                disabled={orderItems.length === 0} // Desabilita se não houver itens
                                style={{ background: '#ff5252', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: orderItems.length === 0 ? 0.5 : 1 }}
                             >
                                🗑️ Limpar Itens
                            </button>
                            {/* Total Geral do Pedido */}
                            <TotalText style={{ margin: 0 }}>Total do Pedido: R$ {formatCurrency(totalPrice)}</TotalText>
                        </TableFooter>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#777', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px' }}>
                        Nenhum item adicionado a este pedido ainda.
                    </p>
                )}
            </div>


            {/* Seção de Pagamento */}
            <div style={{ margin: '30px 0', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                 <h2 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Pagamento</h2>
                {/* Forma de Pagamento */}
                <div style={{ marginBottom: '15px' }}>
                    <span style={{ marginRight: '15px', fontWeight: '500' }}>Forma:</span>
                    <label style={{ marginRight: '20px', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Dinheiro"
                            checked={paymentMethod === "Dinheiro"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ marginRight: '5px' }}
                        /> Dinheiro
                    </label>
                    <label style={{ cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Pix"
                            checked={paymentMethod === "Pix"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                             style={{ marginRight: '5px' }}
                        /> Pix
                    </label>
                    {/* Adicione mais formas de pagamento se necessário */}
                </div>

                {/* Valor Pago */}
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="paymentValueInput" style={{ minWidth: '90px', fontWeight: '500', textAlign: 'right' }}>Valor Pago:</label>
                     <TableInput
                        id="paymentValueInput"
                        type="text" // text para formatação
                        inputMode="decimal" // teclado numérico
                        placeholder="0,00"
                        value={paymentValue} // Estado formatado
                        onChange={(e) => handlePaymentValueChange(e.target.value)} // Handler que formata
                        style={{ width: '150px' }} // Largura fixa
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
            {/* Desabilita se não houver pedido ativo ou itens */}
			<NextButton
                onClick={goToOrderView}
                disabled={!currentOrderId || orderItems.length === 0}
                title={!currentOrderId ? "Crie um Novo Pedido primeiro" : (orderItems.length === 0 ? "Adicione itens ao pedido" : "Finalizar e ir para visualização")}
                style={{
                    marginTop: '30px',
                    width: '100%',
                    padding: '18px',
                    fontSize: '18px',
                    backgroundColor: (!currentOrderId || orderItems.length === 0) ? '#aaa' : '#007BFF', // Cor diferente se desabilitado
                    cursor: (!currentOrderId || orderItems.length === 0) ? 'not-allowed' : 'pointer', // Cursor diferente
                    opacity: (!currentOrderId || orderItems.length === 0) ? 0.6 : 1
                 }}
             >
				<NextButtonText>FINALIZAR E VISUALIZAR PEDIDO</NextButtonText>
			</NextButton>

		</Container>
	);
}