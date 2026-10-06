<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- O Pixel Meta da página de vendas usa a configuração persistida no painel e um inicializador único no navegador; assim a troca de ID não exige código e evita PageView duplicado.
- Os botões externos enviam apenas InitiateCheckout; Purchase exige confirmação de pagamento pelo provedor para não inflar conversões.
- O status de checkout usa o evento existente `click` com `target_key=checkout`, disparado pelos botões e registrado pela sessão de visitante; assim mantém compatibilidade com a restrição atual do banco e não interfere no envio de leads.
- UTMify campaign scripts load once only on /ufhurd; its pixel ID and enabled state are persisted independently in tracking_settings and initialized through TrackingRuntime so Meta configuration remains untouched.
- Os botões de pagamento usam os destinos finais SyncPayments e repassam os parâmetros de campanha no clique, pois o encurtador remove a query no redirecionamento.
