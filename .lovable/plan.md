# Filtro diário do dashboard

## Objetivo
Deixar o painel sempre aberto nos dados de hoje, com opção de escolher outra data no calendário.

## Implementação
- Adicionar um seletor de data no topo do dashboard, iniciado automaticamente na data atual de Brasília.
- Aplicar a data escolhida aos números do dashboard, visitantes e leads exibidos.
- Atualizar os dados automaticamente sem exigir recarregar a página.
- Ao virar o dia em Brasília, retornar o filtro para “Hoje” e zerar os indicadores até surgirem novos dados.
- Manter um botão para voltar rapidamente à data de hoje.

## Validação
- Confirmar que o painel abre filtrado no dia atual.
- Testar uma data anterior e conferir os números e listas correspondentes.
- Simular a mudança de dia e verificar o reset automático.
- Verificar atualização em tempo real e ausência de erros.

## Detalhes técnicos
- Os limites do dia serão calculados no horário de Brasília para evitar diferenças de fuso.
- A filtragem ocorrerá no banco, evitando carregar registros desnecessários.
- Nenhum outro filtro ou fluxo da página será alterado.
