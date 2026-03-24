var CodeReviewEngine = Class.create();
CodeReviewEngine.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /* =================================================
       CONFIGURAÇÃO GLOBAL
       ================================================= */

    SEVERITY: {
        CRITICAL: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },

    /* =================================================
        REGRAS DE ANÁLISE DE CÓDIGO
        Cada chave representa uma verificação específica no código:
        - forbidLogs: Uso de gs.print ou gs.log
        - forbidEval: Uso de eval()
        - glideRecordNoFilter: GlideRecord sem filtro (addQuery, addEncodedQuery ou get)
        - glideAggregateNoFilter: GlideAggregate sem filtro
        - updateMultiple: updateMultiple sem filtro
        - insertWithoutInit: insert() sem initialize()
        - businessRuleUpdate: current.update() em Business Rule
        - aclBypass: setWorkflow(false) seguido de update(), possível bypass de ACL
        - eventQueue: Uso de gs.eventQueue()
        - hardcodedSysId: Sys_id hardcoded no código
        - useGetInsteadOfQuery: addQuery('sys_id', ...) em vez de gr.get(sys_id)
        - nullCheck: Comparação com null, prefira gs.nil()
        - missingTryCatch: Ausência de try/catch no script
        - largeScript: Script muito grande (mais de 400 linhas)
        - highComplexity: Alta complexidade de blocos (mais de 4 níveis de profundidade)
        - manyGetValue: Uso repetido de g_form.getValue() (mais de 3 vezes)
    ================================================= */

    RULES: {
        forbidLogs: 'info',
        forbidEval: 'warning',
        glideRecordNoFilter: 'error',
        glideAggregateNoFilter: 'error',
        updateMultiple: 'error',
        insertWithoutInit: 'error',
        businessRuleUpdate: 'error',
        aclBypass: 'error',
        eventQueue: 'info',
        hardcodedSysId: 'warning',
        useGetInsteadOfQuery: 'info',
        nullCheck: 'info',
        missingTryCatch: 'info',
        largeScript: 'info',
        highComplexity: 'info',
        manyGetValue: 'warning'
    },

    /* =================================================
       AJAX ENTRY
       ================================================= */

    analyzeUpdateSets: function() {
        try {
            var id = this.getParameter('sysparm_update_set');
            var findings = this.analyzeUpdateSetById(id);

            return JSON.stringify({
                errors: findings.filter(f => f.type === 'error').length,
                warnings: findings.filter(f => f.type === 'warning').length,
                info: findings.filter(f => f.type === 'info').length,
                findings: findings
            });

        } catch (e) {
            gs.error("Erro em analyzeUpdateSets: " + e);
            return JSON.stringify({
                findings: [{
                    type: 'error',
                    object: 'CodeReviewEngine',
                    message: 'Falha ao analisar Update Set: ' + e,
                    record_type: '',
                    line: null
                }]
            });
        }
    },

    /* =================================================
       ANALISA UPDATE SET
       ================================================= */

    analyzeUpdateSetById: function(updateSetId) {
        var findings = [];
        try {
            if (!updateSetId)
                return findings;

            var um = new GlideRecord('sys_update_xml');
            um.addQuery('update_set', updateSetId);
            um.addEncodedQuery(
                'typeLIKEScript^ORtypeLIKEBusiness Rule^ORtypeLIKEUI Action^ORtypeLIKEScript Include^ORtypeLIKEClient^action!=DELETE'
            );
            um.query();

            while (um.next()) {
                try {
                    var name = um.getValue('target_name') || 'Unknown';
                    var payload = um.getValue('payload');
                    var code = payload ? String(payload) : '';

                    if (!code) continue;

                    findings = findings.concat(this._analyzeCode(code, name, um));

                } catch (inner) {
                    gs.error("Erro ao analisar registro " + um.getUniqueValue() + ": " + inner);
                }
            }

            // ordenação por severidade
            findings.sort(function(a, b) {
                var order = {
                    error: 1,
                    warning: 2,
                    info: 3
                };
                return order[a.type] - order[b.type];
            });

        } catch (e) {
            gs.error("Erro em analyzeUpdateSetById: " + e);
        }

        return findings;
    },

    /* =================================================
       ANALISADOR DE CÓDIGO
       ================================================= */

    _analyzeCode: function(code, objectName, gr) {
        var results = [];
        if (!code) return results;
        if (objectName && objectName === 'CodeReviewEngine') return results;

        var recordType = gr ? gr.getValue('type') : '';
        var lines = code.split(/\r?\n/);
        var self = this;

        var getValueLines = [];
        var depth = 0;
        var maxDepth = 0;
        var maxDepthLine = null;

        function add(ruleKey, msg, line) {
            var severity = self.RULES[ruleKey];
            if (!severity) return;

            results.push({
                type: severity,
                object: objectName,
                message: msg + (line ? ' (linha ' + line + ')' : ''),
                record_type: recordType,
                line: line || null,
                link: self._buildRecordLink(gr)
            });
        }

        /* =================================================
           VERIFICAÇÃO POR LINHA
           ================================================= */

        lines.forEach(function(line, index) {
            var lineNum = index + 1;
            var trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

            // Logs
            if (/\bgs\.(print|log)\s*\(/.test(line))
                add('forbidLogs', 'Uso de gs.print ou gs.log', lineNum);

            // Eval
            if (/\beval\s*\(/.test(line))
                add('forbidEval', 'Uso de eval()', lineNum);

            // GlideRecord sem filtro
            if (/new GlideRecord\s*\(/.test(line)) {
                var block = lines.slice(index, index + 5).join('\n');
                if (!(/add(Query|EncodedQuery)\s*\(|\.get\s*\(|\.initialize\s*\(/.test(block)))
                    add('glideRecordNoFilter', 'GlideRecord sem filtro', lineNum);
            }

            // GlideAggregate sem filtro
            if (/new GlideAggregate\s*\(/.test(line)) {
                var blockAgg = lines.slice(index, index + 5).join('\n');
                if (!/add(Query|EncodedQuery)\s*\(/.test(blockAgg))
                    add('glideAggregateNoFilter', 'GlideAggregate sem filtro', lineNum);
            }

            // updateMultiple
            if (/updateMultiple\s*\(/.test(line))
                add('updateMultiple', 'updateMultiple sem filtro', lineNum);

            // insert sem initialize
            if (/\.insert\s*\(/.test(line)) {
                // pegar as últimas 20 linhas antes do insert
                var start = Math.max(0, index - 20);
                var block = lines.slice(start, index).join('\n');

                if (!/\.initialize\s*\(\s*\)/.test(block))
                    add('insertWithoutInit', 'insert() sem initialize()', lineNum);
            }

            // Business Rule current.update
            if (recordType === 'Business Rule' && /\bcurrent\.update\s*\(/.test(line))
                add('businessRuleUpdate', 'Business Rule não deve usar current.update()', lineNum);

            // ACL bypass
            if (/setWorkflow\s*\(\s*false\s*\)/.test(line)) {
                var block2 = lines.slice(index, index + 10).join('\n');
                if (/\.update\s*\(/.test(block2))
                    add('aclBypass', 'Possível ACL bypass: setWorkflow(false) + update()', lineNum);
            }

            // EventQueue
            if (/gs\.eventQueue\s*\(/.test(line))
                add('eventQueue', 'Uso de gs.eventQueue(): valide necessidade', lineNum);

            // Sys_id hardcoded
            if (/['"][a-f0-9]{32}['"]/i.test(line))
                add('hardcodedSysId', 'Possível sys_id hardcoded', lineNum);

            // addQuery sys_id
            if (/addQuery\s*\(\s*['"]sys_id['"]\s*,\s*['"][a-f0-9]{32}['"]/.test(line))
                add('useGetInsteadOfQuery', 'Use gr.get(sys_id) para busca direta', lineNum);

            // g_form.getValue
            if (/g_form\.getValue\s*\(/.test(line))
                getValueLines.push(lineNum);

            // Null check
            if (/==\s*null|!=\s*null/.test(line))
                add('nullCheck', 'Prefira gs.nil()', lineNum);

            // Complexidade
            if (/{/.test(line)) {
                depth++;
                if (depth > maxDepth) {
                    maxDepth = depth;
                    maxDepthLine = lineNum;
                }
            }
            if (/}/.test(line)) depth--;
        });

        /* =================================================
           REGRAS GLOBAIS
           ================================================= */

        if (!/\btry\s*{/.test(code))
            add('missingTryCatch', 'Ausência de try/catch');

        if (lines.length > 400)
            add('largeScript', 'Script muito grande (' + lines.length + ' linhas)');

        if (maxDepth > 4)
            add('highComplexity', 'Alta complexidade (' + maxDepth + ')', maxDepthLine);

        if (getValueLines.length > 3)
            getValueLines.forEach(function(n) {
                add('manyGetValue', 'Uso repetido de g_form.getValue()', n);
            });

        return results;
    },

    _buildRecordLink: function(gr) {

    try {

        if (!gr || !gr.isValidRecord())
            return '';

        var baseUrl = gs.getProperty('doc.uri');

        if (gr.getTableName() === 'sys_update_xml') {

            var name = gr.getValue('name');

            if (!name)
                return '';

            var lastUnderscore = name.lastIndexOf('_');

            if (lastUnderscore === -1)
                return '';

            var table = name.substring(0, lastUnderscore);
            var sysId = name.substring(lastUnderscore + 1);

            return baseUrl + table + '.do?sys_id=' + sysId;
        }

        return baseUrl + gr.getTableName() + '.do?sys_id=' + gr.getUniqueValue();

    } catch (e) {
        gs.error('Erro ao montar link do objeto: ' + e);
        return '';
    }
},


    type: 'CodeReviewEngine'
});