var abort = false;

// =====================================
// Verifica se já existe documentação
// =====================================
var check = new GlideRecord('u_central_documentacao_tecnica');
check.addQuery('u_release', current.getUniqueValue());
check.query();

if (check.hasNext()) {
    gs.addErrorMessage('Já existe uma documentação gerada para esta release.');
    action.setAbortAction(true);
    abort = true;
}


// =====================================
// Validação básica
// =====================================
var updateSetList = current.getValue('u_update_set');

if (!abort && !updateSetList) {
    gs.addErrorMessage('Informe ao menos um Update Set antes de gerar a documentação.');
    action.setAbortAction(true);
    abort = true;
}


// =====================================
// Execução principal
// =====================================
if (!abort) {

    var params = {
        releaseId: current.getUniqueValue(),
        updateSetId: updateSetList, // lista de sys_ids
        updateSetName: current.u_update_set.getDisplayValue(),
        audience: 'dev'
    };

    var service = new GetUpdateSetDocumentation();
    var result = service.generateFromRelease(params);

    if (!result || !result.usdh_sys_id) {

        gs.addErrorMessage('Erro ao gerar a documentação.');
        action.setAbortAction(true);

    } else {

        // =====================================
        // Cria relacionamento M2M + Code Review
        // =====================================
        createUpdateSetRelations(result.usdh_sys_id, updateSetList);

        gs.addInfoMessage('Documentação gerada com sucesso: ' + result.usdh_number);

        var usdhGR = new GlideRecord('u_central_documentacao_tecnica');
        if (usdhGR.get(result.usdh_sys_id)) {
            action.setRedirectURL(usdhGR);
        }
    }
}



// =====================================================
// FUNÇÃO: cria M2M + Code Review automático
// =====================================================
function createUpdateSetRelations(docId, listValue) {

    if (!listValue)
        return;

    var ids = listValue.split(',');

    for (var i = 0; i < ids.length; i++) {

        var updateSetId = ids[i].trim();
        if (!updateSetId)
            continue;


        // =====================================
        // Evita duplicidade da M2M
        // =====================================
        var exists = new GlideRecord('u_m2m_central_documentacao_update_set');
        exists.addQuery('u_documentacao', docId);
        exists.addQuery('u_update_set', updateSetId);
        exists.query();

        if (exists.hasNext())
            continue;


        // =====================================
        // CRIA (ou reutiliza) Code Review
        // =====================================
        var reviewId = getOrCreateCodeReview(updateSetId, docId);


        // =====================================
        // CRIA M2M
        // =====================================
        var m2m = new GlideRecord('u_m2m_central_documentacao_update_set');
        m2m.initialize();
        m2m.u_documentacao = docId;
        m2m.u_update_set = updateSetId;
        m2m.u_code_review = reviewId;
        m2m.insert();
    }
}



// =====================================================
// FUNÇÃO: cria Code Review se não existir
// =====================================================
function getOrCreateCodeReview(updateSetId, docId) {

    var review = new GlideRecord('u_code_review');
    review.addQuery('u_update_set', updateSetId);
    review.query();

    // se já existir, reutiliza
    if (review.next())
        return review.getUniqueValue();


    // cria novo
    review.initialize();
    review.u_update_set = updateSetId;
    review.u_status = 'iniciado';     
	
    return review.insert();
}
