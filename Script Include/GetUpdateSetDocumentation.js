var GetUpdateSetDocumentation = Class.create();
GetUpdateSetDocumentation.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getDocumentation: function() {
        var updateSetName = this.getParameter('sysparm_update_set');
        var audience = this.getParameter('sysparm_audience') || 'po';
        var userName = gs.getUserDisplayName();
        var gdt = new GlideDateTime();
        var today = gdt.getLocalDate().getByFormat('dd/MM/yyyy');

        // ===== Página Inicial ===== 
        var homeHtml = "";
        homeHtml += "<div style='text-align:center;margin-bottom:25px;padding:25px;background:#f1f8e9;border:1px solid #c5e1a5;border-radius:8px;'>";
        homeHtml += "  <img src='https://dev355393.service-now.com/0a4bc95b9397b21021cff8eddd03d687.iix' alt='Logo' style='width:300px;height:auto;margin-bottom:10px;' />";

        // Título dinâmico baseado no input de Cenário
        homeHtml += "  <h1 id='tituloPrincipal' style='margin:0;font-size:24px;'>Documentação - ServiceNow</h1>";
        homeHtml += "  <p style='font-size:14px;opacity:0.9;margin-top:6px;'>Gerador automático de evidências de testes e artefatos</p>";
        homeHtml += "</div>";

        if (updateSetName.length === 0)
            return homeHtml + "<p style='color:red;text-align:center;'>Nenhum Update Set informado.</p>";

        // ===== Cabeçalho =====
        var headerHtml = "<div style='background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:15px 20px;margin-bottom:20px;'>";
        headerHtml += "<div style='display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;'>";
        headerHtml += "<h3 style='margin:0;color:#333;'> Evidência de Testes</h3>";
        headerHtml += "<span style='color:#777;font-size:13px;'>Gerado em <b>" + today + "</b></span></div>";
        headerHtml += "<hr style='margin:10px 0;border:none;border-top:1px solid #eee;' />";

        // Inputs e placeholders
        headerHtml += "<table style='width:100%;border-collapse:collapse;font-size:14px;'>";
        headerHtml += "<tr><td style='padding:4px;'><b>Projeto:</b> <input type='text' placeholder='Ex: Portal de Chamados' style='width:90%;border:none;border-bottom:1px solid #ccc;padding:2px;' /></td>";
        headerHtml += "<td style='padding:4px;'><b>Data:</b> " + today + "</td></tr>";
        headerHtml += "<tr><td style='padding:4px;'><b>Executado Por:</b> " + userName + "</td>";
        headerHtml += "<td style='padding:4px;'><b>Squad:</b> <input type='text' placeholder='Nome da Squad' style='width:90%;border:none;border-bottom:1px solid #ccc;padding:2px;' /></td></tr>";
        headerHtml += "<tr><td style='padding:4px;'><b>Ambiente de Testes:</b> <input type='text' placeholder='Ex: DEV / TEST' style='width:90%;border:none;border-bottom:1px solid #ccc;padding:2px;' /></td>";
        headerHtml += "<td style='padding:4px;'><b>Status:</b> <span style='color:#4CAF50;font-weight:bold;'>Pronto</span></td></tr>";

        // Input de Cenário
        headerHtml += "<tr><td style='padding:4px;'><b>Cenário:</b> <input id='inputCenario' type='text' placeholder='Descreva o cenário testado' style='width:90%;border:none;border-bottom:1px solid #ccc;padding:2px;' oninput=\"(function(el){var t=document.getElementById('tituloPrincipal');var v=el.value.trim(); t.textContent = v ? 'Documentação - ' + v : 'Documentação - ServiceNow';})(this)\" onblur=\"(function(el){var t=document.getElementById('tituloPrincipal');var v=el.value.trim(); t.textContent = v ? 'Documentação - ' + v : 'Documentação - ServiceNow';})(this)\" /></td>";
        headerHtml += "<td style='padding:4px;'><b>Sistema:</b> ServiceNow</td></tr>";
        headerHtml += "<tr><td style='padding:4px;'><b>Story:</b> <input type='text' placeholder='Número da story (ex: Story-1234)' style='width:90%;border:none;border-bottom:1px solid #ccc;padding:2px;' /></td>";
        headerHtml += "<td style='padding:4px;'><b>Update Set:</b> " + updateSetName + "</td></tr>";
        headerHtml += "</table>";

        headerHtml += "<div style='margin-top:10px;'><b>Observações:</b>";
        headerHtml += "<textarea placeholder='Adicione observações relevantes...' style='width:100%;margin-top:5px;height:50px;border:1px solid #ccc;border-radius:6px;padding:6px;font-size:13px;resize:none;'></textarea></div></div>";

        // ===== Agrupa itens por tipo =====
        var allowedTypesForPO = ["Script Include", "Business Rule", "UI Page", "Table", "Field Label"];
        var updatesByType = {};
        var gr = new GlideRecord('sys_update_xml');
        gr.addQuery('update_set.name', 'IN', updateSetName);
        gr.orderBy('type');
        gr.query();
        while (gr.next()) {
            var type = gr.type.toString();
            if (audience == "po" && allowedTypesForPO.indexOf(type) == -1) continue;
            if (!updatesByType[type]) updatesByType[type] = [];
            updatesByType[type].push(gr.getUniqueValue());
        }

        // ===== Sumário e evidências =====
        var summaryHtml = "<div style='background:#f1f8e9;border:1px solid #c5e1a5;border-radius:8px;padding:15px 20px;margin-bottom:25px;'>";
        summaryHtml += "<h3 style='margin-top:0;color:#33691e;'> Sumário dos Artefatos</h3><ul style='list-style:none;padding-left:10px;margin:0;'>";
        for (var type in updatesByType) {
            var displayType = (audience == "po") ? this.getTranslatedTypeName(type) : type;
            var anchor = type.toLowerCase().replace(/\s+/g, "_");
            summaryHtml += "<li style='margin:4px 0;'><a href='#" + anchor + "' style='color:#00796b;text-decoration:none;font-weight:bold;'> " + displayType + "</a></li>";
        }
        summaryHtml += "</ul></div>";

        var evidenciasHtml = "<div id='blocoEvidencias' style='background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:15px 20px;margin-bottom:25px;'>";
        evidenciasHtml += "<style>#blocoEvidencias img { max-width:100%; height:auto; display:block; margin:auto; margin-bottom:10px; }</style>";
        evidenciasHtml += "<h3 style='margin-top:0;color:#ff6f00;'> Evidências (Imagens)</h3>";
        evidenciasHtml += "<p style='font-size:13px;color:#555;margin-bottom:10px;'>Aqui você poderá adicionar imagens ou evidências relacionadas ao Update Set.</p>";
        evidenciasHtml += "</div>";

        // ===== Bloco detalhado (sem alteração) =====
        var blocoHtml = "";
        for (var type in updatesByType) {
            var icon = this.getIconByType(type);
            var displayType = (audience == "po") ? this.getTranslatedTypeName(type) : type;
            var anchor = type.toLowerCase().replace(/\s+/g, "_");

            blocoHtml += "<div id='" + anchor + "' style='background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin-bottom:20px;'>";
            blocoHtml += "<h3 style='margin:0 0 8px 0;color:#333;'>" + icon + " " + displayType + "</h3><ul style='list-style:none;padding-left:0;margin:0;'>";

            for (var i = 0; i < updatesByType[type].length; i++) {
                var grItem = new GlideRecord('sys_update_xml');
                if (grItem.get(updatesByType[type][i])) {
                    var friendlyName = this.getFriendlyName(type, grItem);
                    var description = this.getDescriptionByType(type, grItem) || (type === "Field Label" ? "Campo do formulário" : "Sem comentário");
                    var action = grItem.action.toString().toUpperCase();
                    var link = this.getRecordLink(grItem);

                    var actionLabel, actionColor;
                    switch (action) {
                        case 'DELETE':
                            actionLabel = 'Exclusão';
                            actionColor = '#F44336';
                            break;
                        case 'INSERT_OR_UPDATE':
                            actionLabel = 'Criação/Atualização';
                            actionColor = '#FF9800';
                            break;
                        default:
                            actionLabel = 'Outro';
                            actionColor = '#9E9E9E';
                    }

                    blocoHtml += "<li style='padding:8px 10px;margin-bottom:8px;border-radius:6px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:0.2s;'>";
                    blocoHtml += "<div style='display:flex;justify-content:space-between;align-items:center;'><b style='color:#333;'>" + friendlyName + "</b>";
                    blocoHtml += "<span style='background:" + actionColor + ";color:white;padding:2px 8px;border-radius:12px;font-size:11px;'>" + actionLabel + "</span></div>";
                    blocoHtml += "<div style='color:#555;font-size:12px;margin-top:4px;'>" + description + "</div>";
                    blocoHtml += "<div style='margin-top:6px;'><a href='" + link + "' target='_blank' style='color:#2196F3;font-size:12px;text-decoration:none;'> Abrir artefato no ServiceNow</a></div>";
                    blocoHtml += "</li>";
                }
            }

            blocoHtml += "</ul><div style='text-align:right;margin-top:8px;'><a href='#top' style='font-size:12px;color:#00796b;text-decoration:none;'> Voltar ao topo</a></div></div>";
        }

        // ===== Script para atualizar título dinamicamente =====
        /*var scriptHtml = "&lt;script&gt;document.addEventListener('DOMContentLoaded', function(){";
        scriptHtml += "var titulo=document.getElementById('tituloPrincipal');";
        scriptHtml += "var inputCenario=document.getElementById('inputCenario');";
        scriptHtml += "if(inputCenario && titulo){";
        scriptHtml += "inputCenario.addEventListener('input',function(){";
        scriptHtml += "var val=inputCenario.value.trim();";
        scriptHtml += "titulo.textContent = val ? 'Documentação - ' + val : '';";
        scriptHtml += "});}});&lt;/script&gt;";*/

        // ===== Retorno Final =====
        return "<div id='top'>" + homeHtml + headerHtml + summaryHtml + evidenciasHtml + blocoHtml /*+ scriptHtml */+ "</div>";
    },


    getDescriptionByType: function(type, grItem) {
        var description = "";
        var name = grItem.getValue('name');
        var sysIdMatch = name.match(/sys_[a-z_]+_([0-9a-f]{32})/);
        var sysId = sysIdMatch ? sysIdMatch[1] : null;

        switch (type) {
            case 'Script Include':
                if (sysId) {
                    var siGR = new GlideRecord('sys_script_include');
                    if (siGR.get(sysId)) description = siGR.getValue('description');
                }
                break;
            case 'Business Rule':
                if (sysId) {
                    var brGR = new GlideRecord('sys_script');
                    if (brGR.get(sysId)) description = brGR.getValue('description');
                }
                break;
            case 'UI Page':
                if (sysId) {
                    var uiGR = new GlideRecord('sys_ui_page');
                    if (uiGR.get(sysId)) description = uiGR.getValue('description');
                }
                break;
            case 'Table':
                if (sysId) {
                    var tblGR = new GlideRecord('sys_db_object');
                    if (tblGR.get(sysId)) description = tblGR.getValue('description');
                }
                break;
            case 'Field Label':
                description = "Campo do formulário";
                break;
            default:
                description = "";
        }
        return description;
    },

    getFriendlyName: function(type, gr) {
        var name = gr.name.toString();
        /*var sysIdMatch = name.match(/sys_[a-z_]+_([0-9a-f]{32})/);
        var sysId = sysIdMatch ? sysIdMatch[1] : null;*/
        var sysIdMatch = name.match(/([0-9a-f]{32})$/);
        var sysId = sysIdMatch ? sysIdMatch[1] : null;
        var tableMatch = name.match(/^sys_([a-z0-9_]+)_[0-9a-f]{32}$/);
        var tableName = tableMatch ? tableMatch[1] : null;

        switch (type) {
            case 'Script Include':
                if (gr.action == 'DELETE') {

                    var fallback = name.replace(/^sys_script_include_/, '');

                    return "Script Include '" + fallback + "' (excluído)";
                }

                if (sysId) {

                    var siGR = new GlideRecord('sys_script_include');

                    if (siGR.get(sysId)) {

                        var display = siGR.getDisplayValue();
                        var technical = siGR.name.toString();
                        var scope = siGR.sys_scope.getDisplayValue();

                        return display +
                            (technical ? " (" + technical + ")" : "") +
                            (scope ? " [" + scope + "]" : "");
                    }
                }

                return name;
            case 'Business Rule':
                if (sysId) {
                    var brGR = new GlideRecord('sys_script');
                    if (brGR.get(sysId)) return brGR.getDisplayValue() + " (" + brGR.name + ")";
                }
                return name;
            case 'Table':
                if (sysId) {
                    var tblGR = new GlideRecord('sys_db_object');
                    if (tblGR.get(sysId)) return tblGR.getDisplayValue() + " (" + tblGR.name + ")";
                }
                return name;
            case 'UI Page':
                if (sysId) {
                    var uiGR = new GlideRecord('sys_ui_page');
                    if (uiGR.get(sysId)) return uiGR.getDisplayValue() + " (" + uiGR.name + ")";
                }
                var uGR = new GlideRecord('sys_ui_page');
                uGR.addQuery('name', name);
                uGR.query();
                if (uGR.next()) return uGR.title + " (" + name + ")";
                return name;
            case 'Field Label':
                //return this.getFriendlyFieldLabel(name);
                var docGR = new GlideRecord('sys_documentation');
                docGR.addQuery('sys_update_name', name);
                docGR.query();

                if (docGR.next()) {

                    var tableName = docGR.name.toString();
                    var element = docGR.element.toString();
                    var label = docGR.label.toString();
                    var lang = docGR.language.toString();

                    // Label de tabela
                    if (!element) {
                        return "Label da tabela '" + tableName +
                            "' (" + lang + "): " + label;
                    }

                    // Label de campo
                    return "Label do campo '" + element +
                        "' da tabela '" + tableName +
                        "' (" + lang + "): " + label;
                }

                var docName = name.replace(/^sys_documentation_/, '');

                // separa idioma (último _)
                var langIndex = docName.lastIndexOf('_');
                if (langIndex == -1)
                    return name;

                var lang = docName.substring(langIndex + 1);
                var remaining = docName.substring(0, langIndex);

                // tabela (__) ou campo (_u_)
                if (remaining.indexOf('__') > -1) {

                    var tableNameFallback = remaining.replace('__', '_');

                    return "Label da tabela '" + tableNameFallback +
                        "' (" + lang + ")";
                }

                var splitIndex = remaining.lastIndexOf('_u_');

                if (splitIndex > -1) {

                    var tableNameFallback = remaining.substring(0, splitIndex);
                    var fieldNameFallback = remaining.substring(splitIndex + 1);

                    return "Label do campo '" + fieldNameFallback +
                        "' da tabela '" + tableNameFallback +
                        "' (" + lang + ")";
                }

                return name;
            case 'Choice list':
                var parts = name.split('_u_');
                if (parts.length >= 3) {
                    var tableName = parts[0].replace(/^sys_documentation_/, '');
                    var fieldName = parts.slice(1, -1).join('_');
                    var choiceValue = parts[parts.length - 1];
                    return "Choice '" + choiceValue + "' para campo '" + fieldName + "' da tabela '" + tableName + "'";
                }
                return name;
            case 'Access Control':
                if (sysId) {
                    var aclGR = new GlideRecord('sys_security_acl');
                    if (aclGR.get(sysId)) {

                        var table = aclGR.name.toString();
                        var operation = aclGR.operation.toString();
                        var field = aclGR.field.toString();

                        return aclGR.getDisplayValue() +
                            " (" + operation + " em " + table +
                            (field ? "." + field : "") + ")";
                    }
                }
                return name;
            case 'Access Roles':
                if (sysId) {
                    var aclRoleGR = new GlideRecord('sys_security_acl_role');
                    if (aclRoleGR.get(sysId)) {

                        var acl = aclRoleGR.sys_security_acl.getRefRecord();
                        var role = aclRoleGR.sys_user_role.getDisplayValue();

                        if (acl.isValidRecord()) {
                            var table = acl.name.toString();
                            var operation = acl.operation.toString();
                            var field = acl.field.toString();

                            return "Role '" + role + "' na ACL " +
                                acl.getDisplayValue() +
                                " (" + operation + " em " + table +
                                (field ? "." + field : "") + ")";
                        }

                        return "Role '" + role + "' vinculada a ACL";
                    }
                }
                return name;
            case 'App Install':
                if (sysId) {
                    var upgradeGR = new GlideRecord('sys_upgrade_plan_item');
                    if (upgradeGR.get(sysId)) {

                        var appName = '';
                        if (upgradeGR.name)
                            appName = upgradeGR.name.getDisplayValue();

                        var type = upgradeGR.type.toString();

                        var actionLabel = (type == 'install') ? 'Instalação' : 'Upgrade';

                        return actionLabel + " do App '" + appName + "'";
                    }
                }
                return name;
            case 'Application Menu':
                if (sysId && tableName) {

                    if (tableName == 'app_application') {

                        var appMenuGR = new GlideRecord('sys_app_application');
                        if (appMenuGR.get(sysId)) {

                            var title = appMenuGR.title.toString();
                            var name = appMenuGR.name.toString();
                            var scope = appMenuGR.sys_scope.getDisplayValue();

                            return "Menu da aplicação '" + title + "'" +
                                (scope ? " (" + scope + ")" : "") +
                                " [" + name + "]";
                        }
                    }

                    if (tableName == 'ui_application') {

                        var uiAppGR = new GlideRecord('sys_ui_application');
                        if (uiAppGR.get(sysId)) {

                            var uiName = uiAppGR.name.toString();
                            var uiScope = uiAppGR.sys_scope.getDisplayValue();

                            return "Interface da aplicação '" + uiName + "'" +
                                (uiScope ? " (" + uiScope + ")" : "") +
                                " [" + uiName + "]";
                        }
                    }
                }
                return name;
            case 'Custom Application':
                if (sysId) {

                    var appGR = new GlideRecord('sys_app');
                    if (appGR.get(sysId)) {

                        var name = appGR.name.toString();
                        var version = appGR.version.toString();

                        return "Aplicação '" + name + "'" +
                            (version ? " v" + version : "");
                    }
                }
                return name;
            case 'Dictionary':
                var dictGR = new GlideRecord('sys_dictionary');
                dictGR.addQuery('sys_update_name', name);
                dictGR.query();

                if (dictGR.next()) {

                    var tableName = dictGR.name.toString();
                    var fieldName = dictGR.element.toString();
                    var label = dictGR.column_label.toString();

                    if (!fieldName) {

                        var tableGR = new GlideRecord('sys_db_object');
                        if (tableGR.get('name', tableName))
                            return "Definição da tabela '" + tableGR.getDisplayValue() + "'";

                        return "Definição da tabela '" + tableName + "'";
                    }

                    return "Campo '" + label +
                        "' (" + fieldName + ") da tabela '" + tableName + "'";
                }

                var dictName = name.replace(/^sys_dictionary_/, '');

                var splitIndex = dictName.lastIndexOf('_u_');

                if (splitIndex > -1) {

                    var tableNameFallback = dictName.substring(0, splitIndex);
                    var fieldNameFallback = dictName.substring(splitIndex + 1);

                    if (fieldNameFallback == 'null')
                        return "Definição da tabela '" + tableNameFallback + "'";

                    return "Campo '" + fieldNameFallback +
                        "' da tabela '" + tableNameFallback + "'";
                }

                return name;
            case 'Form Layout':

                var sectionGR = new GlideRecord('sys_ui_section');

                if (sectionGR.get(sysId)) {

                    var tableLabel = sectionGR.name.getDisplayValue();
                    var viewName = sectionGR.view_name || "Default view";

                    // Não é seção visível
                    if (!sectionGR.caption) {
                        return "Layout interno do formulário '" +
                            tableLabel + "' (view: " + viewName + ")";
                    }

                    var sectionTitle =
                        sectionGR.title ||
                        sectionGR.caption ||
                        "Sem título";

                    return "Seção '" + sectionTitle +
                        "' do formulário '" + tableLabel +
                        "' (view: " + viewName + ")";
                }

                return name;
            case 'Form Sections':

                var formSectionsGR = new GlideRecord('sys_ui_form');

                if (formSectionsGR.get(sysId)) {

                    var tableLabel = formSectionsGR.name.getDisplayValue();
                    var viewName = formSectionsGR.view || "Default view";

                    return "Configuração de seções do formulário '" +
                        tableLabel + "' (view: " + viewName + ")";
                }

                return name;
            case 'Macro':

                if (sysId) {

                    var macroGR = new GlideRecord('sys_ui_macro');

                    // Registro ainda existe
                    if (macroGR.get(sysId)) {

                        var macroName = macroGR.name.toString();
                        var scope = macroGR.sys_scope.getDisplayValue();

                        return "UI Macro '" + macroName + "'" +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                var macroNameFallback = name.replace(/^sys_ui_macro_/, '');

                return "UI Macro '" + macroNameFallback + "' (excluída)";
            case 'Module':
                if (gr.action == 'DELETE') {
                    var fallback = name.replace(/^sys_(app|ui)_module_/, '');
                    return "Módulo '" + fallback + "' (excluído)";
                }

                if (sysId) {

                    var moduleGR = new GlideRecord('sys_app_module');

                    // tenta primeiro tabela moderna
                    if (!moduleGR.get(sysId)) {
                        moduleGR = new GlideRecord('sys_ui_module');
                        moduleGR.get(sysId);
                    }

                    if (moduleGR.isValidRecord()) {

                        var title = moduleGR.title || moduleGR.name;
                        var appName = moduleGR.application.getDisplayValue();
                        var scope = moduleGR.sys_scope.getDisplayValue();

                        return "Módulo '" + title + "'" +
                            (appName ? " da aplicação '" + appName + "'" : "") +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'Number':

                if (sysId) {

                    var numGR = new GlideRecord('sys_number');

                    if (numGR.get(sysId)) {

                        var tableLabel = numGR.category.getDisplayValue();
                        var prefix = numGR.prefix;

                        return "Numeração automática da tabela '" +
                            tableLabel + "'" +
                            (prefix ? " (prefixo: " + prefix + ")" : "");
                    }
                }

                return name;
            case 'Role':

                if (gr.action == 'DELETE') {
                    var fallback = name.replace(/^sys_user_role_/, '');
                    return "Role '" + fallback + "' (excluída)";
                }

                if (sysId) {

                    var roleGR = new GlideRecord('sys_user_role');

                    if (roleGR.get(sysId)) {

                        var roleName = roleGR.name.toString();
                        var scope = roleGR.sys_scope.getDisplayValue();
                        var desc = roleGR.description;

                        return "Role '" + roleName + "'" +
                            (desc ? " — " + desc : "") +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'System Property':
                if (gr.action == 'DELETE') {
                    var fallback = name.replace(/^sys_properties_/, '');
                    return "System Property '" + fallback + "' (excluída)";
                }

                if (sysId) {

                    var propGR = new GlideRecord('sys_properties');

                    if (propGR.get(sysId)) {

                        var propName = propGR.name.toString();
                        var scope = propGR.sys_scope.getDisplayValue();
                        var desc = propGR.description;

                        return "System Property '" + propName + "'" +
                            (desc ? " — " + desc : "") +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'UI Action':

                if (gr.action == 'DELETE') {

                    var fallback = name.replace(/^sys_ui_action_/, '');

                    return "UI Action '" + fallback + "' (excluída)";
                }

                if (sysId) {

                    var actionGR = new GlideRecord('sys_ui_action');

                    if (actionGR.get(sysId)) {

                        var label = actionGR.name.toString();
                        var tableLabel = actionGR.table.getDisplayValue();
                        var scope = actionGR.sys_scope.getDisplayValue();

                        var location = "";

                        if (actionGR.form_button == true)
                            location = " (formulário)";
                        else if (actionGR.list_button == true)
                            location = " (lista)";

                        return "UI Action '" + label + "'" +
                            (tableLabel ? " na tabela '" + tableLabel + "'" : "") +
                            location +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'UI Formatter':
                if (gr.action == 'DELETE') {
                    var fallback = name.replace(/^sys_ui_formatter_/, '');
                    return "UI Formatter '" + fallback + "' (excluído)";
                }

                if (sysId) {

                    var fmtGR = new GlideRecord('sys_ui_formatter');

                    if (fmtGR.get(sysId)) {

                        var formatter = fmtGR.formatter.toString();
                        var table = fmtGR.table.getDisplayValue();
                        var scope = fmtGR.sys_scope.getDisplayValue();

                        return "UI Formatter '" + formatter + "'" +
                            (table ? " no formulário '" + table + "'" : "") +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'UI Formatter':

                if (gr.action == 'DELETE') {
                    var fallback = name.replace(/^sys_ui_formatter_/, '');
                    return "UI Formatter '" + fallback + "' (excluído)";
                }

                if (sysId) {

                    var fmtGR = new GlideRecord('sys_ui_formatter');

                    if (fmtGR.get(sysId)) {

                        var formatter = fmtGR.formatter.toString();
                        var table = fmtGR.table.getDisplayValue();
                        var scope = fmtGR.sys_scope.getDisplayValue();

                        return "UI Formatter '" + formatter + "'" +
                            (table ? " no formulário '" + table + "'" : "") +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'UX App Theme':

                if (!name.startsWith('m2m_app_config_theme_'))
                    return name;

                if (gr.action == 'DELETE') {

                    var fallback = name.replace(/^m2m_app_config_theme_/, '');

                    return "Tema UX '" + fallback + "' desvinculado";
                }

                if (sysId) {

                    var themeGR = new GlideRecord('m2m_app_config_theme');

                    if (themeGR.get(sysId)) {

                        var app = themeGR.ux_app_configuration.getDisplayValue();
                        var theme = themeGR.theme.getDisplayValue();
                        var scope = themeGR.sys_scope.getDisplayValue();

                        return "Tema '" + theme +
                            "' aplicado à experiência '" + app + "'" +
                            (scope ? " (" + scope + ")" : "");
                    }
                }

                return name;
            case 'UI Action Role':

                if (gr.action == 'DELETE') {

                    var actionName = '';
                    var roleName = '';

                    if (gr.payload) {
                        var xml = new XMLDocument2();
                        xml.parseXML(gr.payload);

                        actionName = xml.getNodeText('//ui_action/display_value');
                        roleName = xml.getNodeText('//role/display_value');
                    }

                    return "Permissão da role '" + (roleName || '?') +
                        "' removida da UI Action '" + (actionName || '?') + "'";
                }

                if (sysId) {

                    var relGR = new GlideRecord('sys_ui_action_role');

                    if (relGR.get(sysId)) {

                        var actionName = relGR.ui_action.getDisplayValue();
                        var roleName = relGR.role.getDisplayValue();

                        return "UI Action '" + actionName +
                            "' vinculada à role '" + roleName + "'";
                    }
                }

                return name;
            case 'Password Reset Process':
                
                if (gr.action == 'DELETE') {

                    var processName = '';

                    if (gr.payload) {
                        var xml = new XMLDocument2();
                        xml.parseXML(gr.payload);

                        processName = xml.getNodeText('//name') ||
                                    xml.getNodeText('//display_value');
                    }

                    return "Processo de redefinição de senha '" +
                        (processName || name) + "' removido";
                }

                if (sysId) {

                    var pwdGR = new GlideRecord('pwd_process');

                    if (pwdGR.get(sysId)) {

                        var display = pwdGR.getDisplayValue();
                        var internal = pwdGR.name.toString();

                        return "Processo de redefinição de senha '" +
                            display + "' (" + internal + ")";
                    }
                }

                return name;
            default:
                return name;
        }
    },

    getFriendlyFieldLabel: function(updateXmlName) {
        var nameWithoutPrefix = updateXmlName.replace(/^sys_documentation_/, '');
        var lastUIndex = nameWithoutPrefix.lastIndexOf('_u_');
        var columnName = lastUIndex !== -1 ? nameWithoutPrefix.substring(lastUIndex + 1) : nameWithoutPrefix;
        columnName = columnName.replace(/_en$/, '');
        var fGR = new GlideRecord('sys_dictionary');
        fGR.addQuery('element', columnName);
        fGR.query();
        if (fGR.next()) return fGR.column_label + " (" + columnName + ")";
        return columnName;
    },

    getIconByType: function(type) {
        switch (type) {
            // ==== Back-end ====
            case 'Script Include':
                return '🧠';
            case 'Business Rule':
                return '⚙️';
            case 'Scheduled Script Execution': // Scheduled Job
            case 'Scheduled Script':
                return '⏰';
            case 'Fix Script':
                return '🩹';
            case 'Flow':
                return '🌊';
            case 'Subflow':
                return '🌊';
            case 'Action':
                return '🎯';
            case 'Flow Action':
                return '🔁';
            case 'Script Action':
                return '📜';
            case 'Scripted REST Resource':
                return '🔌';
            case 'Scripted REST API':
                return '🌐';
            case 'REST Message':
                return '📡';
            case 'SOAP Message':
                return '🧴';
            case 'Transform Map':
                return '🔄';
            case 'Import Set Table':
                return '📥';
            case 'Import Set Transform Map':
                return '♻️';
            case 'Data Source':
                return '🗂️';
            case 'Record Producer':
                return '🧾';
            case 'Catalog Script':
                return '💬';
            case 'Script Include Test':
                return '🧪';
            case 'Access Control':
                return '🔒';
            case 'ACL':
                return '🔐';
            case 'Event Registry':
                return '📣';
            case 'Notification Email Script':
                return '📧';
            case 'Notification':
                return '📨';
            case 'UI Script':
                return '🪶';
            case 'UI Macro':
                return '🧩';
            case 'UI Formatter':
                return '🪄';
            case 'Processor':
                return '⚙️';

                // ==== Front-end / UI ====
            case 'UI Page':
                return '🌍';
            case 'UI Action':
                return '🎬';
            case 'UI Policy':
                return '🧭';
            case 'Client Script':
                return '💻';
            case 'Form Design':
                return '🧱';
            case 'Form Layout':
                return '🧩';
            case 'Field Label':
                return '🏷️';
            case 'Catalog Client Script':
                return '🖱️';
            case 'Catalog UI Policy':
                return '🎨';
            case 'Widget':
                return '🧱';
            case 'Service Portal':
                return '🚪';
            case 'Theme':
                return '🎨';
            case 'Menu':
                return '📜';
            case 'Module':
                return '📁';
            case 'Application Menu':
                return '🧭';
            case 'Navigation Menu':
                return '🗺️';
            case 'Page Route':
                return '🛤️';
            case 'Dashboard':
                return '📊';
            case 'Report':
                return '📈';
            case 'Visualization':
                return '📉';
            case 'UI Builder Page':
                return '🏗️';

                // ==== Dados / Estrutura ====
            case 'Table':
                return '🗃️';
            case 'Dictionary Entry':
                return '📚';
            case 'Dictionary Override':
                return '📘';
            case 'Field':
                return '🧾';
            case 'Choice List':
                return '🔢';
            case 'Reference Qualifier':
                return '🔗';
            case 'List Layout':
                return '🧮';
            case 'Form Section':
                return '📋';
            case 'View':
                return '👁️';
            case 'Relationship':
                return '🪢';
            case 'CI Relationship':
                return '🔩';
            case 'CI Class':
                return '🏭';

                // ==== Catálogo / Portal ====
            case 'Catalog Item':
                return '🛒';
            case 'Record Producer':
                return '🧾';
            case 'Order Guide':
                return '📦';
            case 'Flow Designer Action':
                return '⚡';
            case 'Flow Designer Subflow':
                return '🔄';

                // ==== Workflows e Automação ====
            case 'Workflow':
                return '🔁';
            case 'Workflow Activity':
                return '⚙️';
            case 'Approval Definition':
                return '✅';
            case 'Approval Rule':
                return '☑️';
            case 'Assignment Rule':
                return '📌';
            case 'Notification Trigger':
                return '🔔';

                // ==== Segurança e Configuração ====
            case 'Role':
                return '🧩';
            case 'Group':
                return '👥';
            case 'User':
                return '👤';
            case 'Property':
                return '⚙️';
            case 'System Property':
                return '🧭';
            case 'UI Property':
                return '🪟';
            case 'Access Role':
                return '🔐';
            case 'Security Rule':
                return '🛡️';
            case 'Domain':
                return '🌐';
            case 'Domain Separation':
                return '🌍';

                // ==== Integrações ====
            case 'Connection & Credential Alias':
                return '🔑';
            case 'MID Server Script Include':
                return '🛰️';
            case 'IntegrationHub':
                return '🔗';
            case 'Spoke':
                return '🛠️';
            case 'REST API Explorer':
                return '🚀';
            case 'Outbound REST Message':
                return '📤';
            case 'Inbound REST Message':
                return '📥';

                // ==== Outros ====
            case 'Update Set':
                return '📦';
            case 'Application File':
                return '🗂️';
            case 'System Definition':
                return '⚙️';
            case 'Global UI Script':
                return '🌐';
            case 'Style Sheet':
                return '🎨';
            case 'Content Block':
                return '🧱';
            case 'Content Layout':
                return '🖼️';
            case 'Content Theme':
                return '🪶';
            case 'Content Type':
                return '📑';
            case 'Announcement':
                return '📢';
            case 'Knowledge Article':
                return '📘';
            case 'SLA Definition':
                return '⏱️';
            case 'SLA Workflow':
                return '📏';
            case 'Metric Definition':
                return '📊';
            case 'Report Source':
                return '📄';
            case 'Scripted REST API Resource':
                return '🔌';
            case 'Schedule':
                return '📆';
            case 'Email Layout':
                return '✉️';
            case 'Email Notification':
                return '📨';
            case 'Email Template':
                return '📧';

                // ==== Padrão ====
            default:
                return '📄';
        }
    },

    getTranslatedTypeName: function(type) {
        var map = {
            "Script Include": "Script de Servidor",
            "Business Rule": "Regra de Negócio",
            "UI Page": "Página de Interface",
            "UI Action": "Botão ou Ação de Interface",
            "UI Policy": "Política de Interface",
            "Client Script": "Script de Cliente",
            "Table": "Tabela de Dados",
            "Field Label": "Rótulo de Campo",
            "Flow": "Fluxo de Automação",
            "Subflow": "Subfluxo",
            "Widget": "Componente de Portal",
            "Catalog Item": "Item de Catálogo",
            "Record Producer": "Produtor de Registro",
            "Notification": "Notificação",
            "Report": "Relatório",
            "Dashboard": "Painel",
            "Role": "Função de Acesso",
            "Group": "Grupo de Usuários",
            "Property": "Propriedade do Sistema",
            "Scripted REST API": "API REST Personalizada",
            "Transform Map": "Mapa de Transformação",
            "Import Set Table": "Tabela de Importação",
            "Access Control": "Controle de Acesso",
            "Workflow": "Fluxo de Trabalho",
            "Application Menu": "Menu de Aplicação",
            "Module": "Módulo de Navegação",
            "UI Builder Page": "Página do UI Builder",
            "Style Sheet": "Folha de Estilo (CSS)",
            "Notification Email Script": "Script de E-mail",
            "Fix Script": "Script de Correção",
            "REST Message": "Mensagem REST",
            "Event Registry": "Registro de Evento",
            "Dictionary Entry": "Entrada de Dicionário",
            "Choice List": "Lista de Opções",
            "Form Design": "Design de Formulário",
            "Form Layout": "Layout de Formulário"
        };

        return map[type] || type;
    },

    getRecordLink: function(gr) {
        var instanceUrl = gs.getProperty('doc.uri');
        var link = "";
        var nameMatch = gr.name.match(/^(.*)_([0-9a-f]{32})$/i);
        if (nameMatch) link = instanceUrl + nameMatch[1] + ".do?sys_id=" + nameMatch[2];

        return link;
    },

    generateFromRelease: function(params) {

        var html = this.getDocumentation(params);

        var gr = new GlideRecord('u_central_documentacao_tecnica');
        gr.initialize();
        gr.u_release = params.releaseId;
        gr.u_update_set = params.updateSetId;
		gr.u_status = 'andamento';
        var usdhSysId = gr.insert();

        return {
            usdh_sys_id: usdhSysId,
            usdh_number: gr.u_number.toString()
        };
    },

    getNameUpdateSet: function() {
        // Recebe os sys_ids separados por vírgula
        var sysIds = this.getParameter('sysparm_update_set_ids');
        if (!sysIds) return '';

        var idsArray = sysIds.split(',');
        var namesArray = [];

        var gr = new GlideRecord('sys_update_set');
        gr.addQuery('sys_id', 'IN', sysIds);
        gr.query();
        while (gr.next()) {
            namesArray.push(gr.getValue('name'));
        }

        // Retorna todos os nomes separados por vírgula
        return namesArray.join(', ');
    },

});