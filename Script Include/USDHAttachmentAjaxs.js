var USDHAttachmentAjaxs = Class.create();
USDHAttachmentAjaxs.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    uploadImage: function() {

        var recordSysId = this.getParameter('sysparm_record_sys_id');
        var fileName = this.getParameter('sysparm_file_name');
        var fileBase64 = this.getParameter('sysparm_file_base64');

        gs.info('USDH DEBUG - recordSysId: ' + recordSysId);
        gs.info('USDH DEBUG - fileName: ' + fileName);
        gs.info('USDH DEBUG - fileBase64 exists: ' + (!!fileBase64));

        if (!recordSysId || !fileBase64) {
            gs.error('USDH DEBUG - parâmetros inválidos');
            return '';
        }

        if (fileBase64.indexOf('base64,') > -1) {
            fileBase64 = fileBase64.split('base64,')[1];
        }

        var bytes = GlideStringUtil.base64DecodeAsBytes(fileBase64);
        gs.info('USDH DEBUG - bytes length: ' + bytes.length);

        var gr = new GlideRecord('u_central_documentacao_tecnica');
        if (!gr.get(recordSysId)) {
            gs.error('USDH DEBUG - Registro não encontrado');
            return '';
        }

        var sa = new GlideSysAttachment();
        var attachmentSysId = sa.write(
            gr,
            fileName,
            'image/png',
            bytes
        );

        gs.info('USDH DEBUG - attachmentSysId: ' + attachmentSysId);

        return attachmentSysId;
    },

    deleteImage: function() {

        var attachmentSysId = this.getParameter('sysparm_attachment_sys_id');

        if (!attachmentSysId) {
            return 'false';
        }

        var att = new GlideRecord('sys_attachment');
        if (att.get(attachmentSysId)) {
            att.deleteRecord();
            return 'true';
        }

        return 'false';
    },

    saveDescription: function() {

        var attId = this.getParameter('sysparm_attachment_sys_id');
        var desc = this.getParameter('sysparm_description');

        if (!attId)
            return 'false';

        var att = new GlideRecord('sys_attachment');

        if (!att.get(attId)) {
            gs.error('Attachment NÃO encontrado');
            return 'false';
        }

        var parent = new GlideRecord(att.table_name);

        if (!parent.get(att.table_sys_id)) {
            gs.error('Registro pai NÃO encontrado');
            return 'false';
        }

        try {
            var texto = '[USDH_ATTACHMENT] ' + JSON.stringify({
                sys_id: attId,
                desc: desc || ''
            });

            parent.u_work_notes.setJournalEntry(texto);
            var result = parent.update();
        } catch (e) {
            gs.error('ERRO EXCEPTION: ' + e.message);
        }

        return 'true';
    },

    getImages: function() {

        var recordSysId = this.getParameter('sysparm_record_sys_id');
        var tableName = this.getParameter('sysparm_table');

        var result = [];

        var att = new GlideRecord('sys_attachment');
        att.addQuery('table_sys_id', recordSysId);
        att.addQuery('table_name', tableName);
        att.addQuery('content_type', 'STARTSWITH', 'image/');
        att.orderBy('sys_created_on');
        att.query();

        while (att.next()) {

            var description = '';
            var attId = att.getUniqueValue();

            var jf = new GlideRecord('sys_journal_field');
            jf.addQuery('element_id', recordSysId);
            jf.addQuery('element', 'u_work_notes');
            jf.addQuery('value', 'CONTAINS', attId);
            jf.orderByDesc('sys_created_on');
            jf.setLimit(1);
            jf.query();

            if (jf.next()) {

                var texto = jf.value.toString();
                // remove o prefixo
                texto = texto.replace('[USDH_ATTACHMENT] ', '');
				var obj = JSON.parse(texto);
				description = obj.desc || '';
            }

            result.push({
                sys_id: attId,
                file_name: att.file_name.toString(),
                description: description
            });
        }

        return JSON.stringify(result);
    },

    type: 'USDHAttachmentAjaxs'
});