function ProximaEtapa() {
    if (confirm("Tem certeza que deseja avançar para a proxíma etapa?")) {
        gsftSubmit(null, g_form.getFormElement(), "proxima_etapa");
    } else {
        return false;
    }
}

if (typeof window == 'undefined')
    setRedirect();

function setRedirect() {
    proximaEtapa();
}

function proximaEtapa() {
    try {
        var service = new CDT_FluxoService();
        var msg = '';

        var status = (current.u_status || '').toLowerCase();

        switch (status) {

            case 'rascunho':
                msg = service.concluirDocumentacao(current);
                break;

            case 'revisao_aprovada':
                msg = service.iniciarSubida(current);
                break;

            case 'correcao_requerida':
                msg = service.concluirDocumentacao(current);
                gs.addInfoMessage('Correção necessária: Dev deve ajustar documentação ou código.');
                action.setRedirectURL(current);
                break;

            default:
                gs.addInfoMessage('Nenhuma ação disponível para o status atual.');
                action.setRedirectURL(current);
        }

        if (msg)
            gs.addInfoMessage(msg);

        action.setRedirectURL(current);

    } catch (e) {
        gs.addErrorMessage('Erro inesperado: ' + e.message);
        gs.error('Erro inesperado no Script: ' + e.stack);
        action.setRedirectURL(current);
    }
}