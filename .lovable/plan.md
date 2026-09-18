# Acompanhamento ao vivo mais específico

## Objetivo
Mostrar no painel, em tempo real, quando o visitante entra no campo Pix, está digitando, para de digitar ou sai do campo, sem registrar o conteúdo digitado. Garantir também que o primeiro clique no botão voltar exiba o popup antes de sair da página.

## Implementação
- Refinar os eventos do campo Pix para registrar foco, digitação, pausa e saída do campo.
- Manter apenas estados de interação e horários; a chave Pix digitada não será enviada ao acompanhamento.
- Exibir “Digitando...” enquanto houver atividade recente e atualizar o status automaticamente quando ela parar.
- Ajustar a proteção de navegação para criar uma entrada de histórico confiável e consumir o primeiro “voltar” abrindo o popup.
- Ao escolher continuar no popup, manter o visitante na página e rearmar a proteção para uma nova tentativa de saída.

## Validação
- Testar foco, digitação, pausa e saída do campo Pix na página `/ufhurd`.
- Confirmar a atualização correspondente na listagem de visitantes do painel.
- Testar o botão voltar em navegação normal e após fechar o popup.
- Verificar compilação e ausência de erros no navegador.

## Detalhes técnicos
- Mudanças cirúrgicas nos arquivos de rastreamento, painel e popup.
- Persistência compatível com os eventos analíticos existentes; qualquer ajuste de restrição manterá RLS e permissões atuais.
- Nenhuma alteração no envio do lead, valores, ofertas ou lógica de bloqueio por IP.
