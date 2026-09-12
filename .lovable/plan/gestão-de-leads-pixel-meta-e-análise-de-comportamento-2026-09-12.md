# Gestão de leads, Pixel Meta e análise de comportamento

## Objetivo
Ampliar o painel administrativo com exclusão e exportação de leads, configuração do Pixel Meta e uma visão detalhada da jornada de cada visitante na página `/ufhurd`.

## O que será construído

### 1. Ações sobre leads
- Adicionar exclusão individual em cada lead, com confirmação antes de apagar.
- Adicionar exclusão em massa, também com confirmação reforçada.
- Adicionar exportação CSV de todos os leads exibidos, incluindo data/hora, chave Pix, WhatsApp, IP e status.
- Atualizar imediatamente a lista após exclusões e mostrar erros sem perder a tela.

### 2. Configuração do Pixel Meta
- Criar uma seção administrativa para inserir, substituir, ativar e remover o ID do Pixel.
- Validar o formato do ID antes de salvar.
- Carregar o Pixel somente em `/ufhurd` quando estiver configurado e ativo.
- Registrar os eventos essenciais: visualização da página, início/progresso do vídeo, formulário liberado e lead enviado.
- Não enviar chave Pix, WhatsApp, IP ou conteúdo digitado para a Meta.

### 3. Comportamento dos visitantes
- Registrar sessões anônimas da página: entrada, permanência, cliques, profundidade de rolagem, progresso máximo do vídeo, liberação do formulário, envio do lead e saída.
- Registrar movimento do ponteiro de forma amostrada e compacta para mapa de calor, sem gravar teclas ou valores dos campos.
- Associar a sessão ao lead apenas depois do envio, permitindo abrir a jornada daquele lead no painel.
- Criar no painel uma seção de sessões com resumo e detalhes cronológicos de cada jornada.
- Exibir métricas úteis: duração, último ponto do vídeo, maior rolagem, quantidade de cliques, dispositivo e origem.

### 4. Privacidade e segurança
- Atualizar a Política de Privacidade para explicar analytics e Pixel Meta.
- Mostrar consentimento para rastreamento não essencial antes de ativar Pixel e análise detalhada.
- Manter somente dados necessários, limitar volume/frequência dos eventos e proteger leituras administrativas por login e função de administrador.
- Aplicar RLS, permissões explícitas e validação no servidor em todas as novas tabelas e funções.

## Detalhes técnicos
- Novas tabelas: configuração de rastreamento, sessões e eventos, com índices, RLS e permissões mínimas.
- Escritas públicas passarão por uma função de servidor validada; configurações e relatórios exigirão autenticação administrativa.
- Eventos de alto volume serão agrupados e enviados em lotes para reduzir impacto na velocidade da página.
- Exportação será gerada localmente no painel a partir dos dados já autorizados.

## Validação
- Verificar exclusão individual e em massa, download CSV e atualização da lista.
- Verificar salvar/remover Pixel e ausência total do script quando desativado ou sem consentimento.
- Verificar uma sessão real em `/ufhurd` e sua visualização no painel.
- Confirmar que nenhum conteúdo dos campos é coletado pelos eventos comportamentais.
