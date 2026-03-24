var abort = false;

try {

    if (documentationAlreadyExists())
        abort = true;

    if (!abort && !validateUpdateSet())
        abort = true;

    if (!abort)
        generateDocumentationFlow();

} catch (e) {
    handleUnexpectedError(e);
}


// =====================================================
// VALIDA SE JÁ EXISTE DOCUMENTAÇÃO PARA A RELEASE
// =====================================================
function documentationAlreadyExists() {

    var gr = new GlideRecord('u_central_documentacao_tecnica');
    gr.addQuery('u_release', current.getUniqueValue());
    gr.query();

    if (gr.hasNext()) {
        gs.addErrorMessage('Já existe uma documentação gerada para esta release.');
        action.setAbortAction(true);
        return true;
    }

    return false;
}

// =====================================================
// VALIDA SE FOI INFORMADO AO MENOS UM UPDATE SET
// =====================================================
function validateUpdateSet() {

    var updateSetList = current.getValue('u_update_set');

    if (!updateSetList) {
        gs.addErrorMessage('Informe ao menos um Update Set antes de gerar a documentação.');
        action.setAbortAction(true);
        return false;
    }

    return true;
}

// =====================================================
// GERA DOCUMENTAÇÃO (apenas cria registro Rascunho)
// =====================================================
function generateDocumentationFlow() {

    try {

        var params = buildParams();

        // =====================================================
        // Chama apenas getDocumentation
        // =====================================================
        var html = this.getDocumentation(params);

        // =====================================================
        // Cria o registro na CDT com status "Rascunho"
        // =====================================================
        var gr = new GlideRecord('u_central_documentacao_tecnica');
        gr.initialize();
        gr.u_release = params.releaseId;
        gr.u_update_set = params.updateSetId;
        gr.u_status = 'rascunho';
        var usdhSysId = gr.insert();

        // =====================================================
        // Cria M2M e Code Review automaticamente
        // =====================================================
        createUpdateSetRelations(usdhSysId, params.updateSetId);

        gs.addInfoMessage('Documentação criada com sucesso: ' + gr.u_number);

        // =====================================================
        // Redireciona para o registro criado
        // =====================================================
        redirectToDocumentation(usdhSysId);

    } catch (e) {
        gs.addErrorMessage('Erro ao gerar a documentação: ' + e.message);
        gs.error('Erro no fluxo principal: ' + e.stack);
        action.setAbortAction(true);
    }
}

// =====================================================
// CONTRUÇÃO DE PARAMS
// =====================================================
function buildParams() {

    return {
        releaseId: current.getUniqueValue(),
        updateSetId: current.getValue('u_update_set'),
        updateSetName: current.u_update_set.getDisplayValue(),
        audience: 'dev'
    };
}

// =====================================================
// REDIRECIONA PARA DOCUMENTAÇÃO GERADA
// =====================================================
function redirectToDocumentation(docId) {

    var usdhGR = new GlideRecord('u_central_documentacao_tecnica');

    if (usdhGR.get(docId)) {
        action.setRedirectURL(usdhGR);
    }
}

// =====================================================
// CRIA M2M + CODE REVIEW AUTOMÁTICO
// =====================================================
function createUpdateSetRelations(docId, listValue) {

    try {

        if (!listValue)
            return;

        var ids = listValue.split(',');

        for (var i = 0; i < ids.length; i++) {

            var updateSetId = ids[i].trim();
            if (!updateSetId)
                continue;

            if (relationAlreadyExists(docId, updateSetId))
                continue;

            var reviewId = getOrCreateCodeReview(updateSetId);

            var m2m = new GlideRecord('u_m2m_central_documentacao_update_set');
            m2m.initialize();
            m2m.u_documentacao = docId;
            m2m.u_update_set = updateSetId;
            m2m.u_code_review = reviewId;
            m2m.insert();
        }

    } catch (e) {
        gs.addErrorMessage('Erro ao criar relações M2M ou Code Review: ' + e.message);
        gs.error('Erro em createUpdateSetRelations: ' + e.stack);
        action.setAbortAction(true);
    }
}

// =====================================================
// VERIFICA SE RELAÇÃO JÁ EXISTE
// =====================================================
function relationAlreadyExists(docId, updateSetId) {

    var exists = new GlideRecord('u_m2m_central_documentacao_update_set');
    exists.addQuery('u_documentacao', docId);
    exists.addQuery('u_update_set', updateSetId);
    exists.query();

    return exists.hasNext();
}

// =====================================================
// CRIA CODE REVIEW SE NÃO EXISTIR
// =====================================================
function getOrCreateCodeReview(updateSetId) {

    try {

        var review = new GlideRecord('u_code_review');
        review.addQuery('u_update_set', updateSetId);
        review.query();

        if (review.next())
            return review.getUniqueValue();

        review.initialize();
        review.u_update_set = updateSetId;
        review.u_status = 'iniciado';

        return review.insert();

    } catch (e) {
        gs.addErrorMessage('Erro ao criar Code Review: ' + e.message);
        gs.error('Erro em getOrCreateCodeReview: ' + e.stack);
        return null;
    }
}

// =====================================================
// TRATA ERROS INESPERADOS
// =====================================================
function handleUnexpectedError(e) {
    gs.addErrorMessage('Erro inesperado no script: ' + e.message);
    gs.error('Erro inesperado: ' + e.stack);
    action.setAbortAction(true);
}
