function ConcluirSubida() {
    if (confirm("Tem certeza que deseja concluir a subida?")) {
		gsftSubmit(null, g_form.getFormElement(), "concluir_subida");
	} else {
		return false;
	}
}

if (typeof window == 'undefined')
    setRedirect();

function setRedirect() {
    concluirSubida();
}

function concluirSubida(){
	try {
		var service = new CDT_FluxoService();
		var msg = service.concluirSubida(current);
		gs.addInfoMessage(msg);
		action.setRedirectURL(current);
	} catch(e) {
		gs.addErrorMessage('Erro ao concluir a subida: ' + e.message);
		gs.error(e);
		action.setRedirectURL(current);
	}
}