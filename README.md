# 📚 Central de Documentação Técnica – ServiceNow

Hub de governança técnica para CAB no ServiceNow.

A solução centraliza **Documentação Técnica, Code Review e Instance Scan** em um único fluxo obrigatório, garantindo que **todos os Update Sets passem por validações antes do deploy**.

---

## 🚀 Problema

Em muitos projetos ServiceNow, Update Sets são promovidos sem:

- documentação adequada
- revisão de código
- validações técnicas
- rastreabilidade

Isso gera:

❌ incidentes em produção  
❌ retrabalho  
❌ perda de conhecimento  
❌ baixa governança  
❌ dificuldade de auditoria  

---

## ✅ Solução

A **Central de Documentação Técnica** atua como um **Quality Gate do CAB**.

Nenhum CAB pode ser finalizado sem:

✔ Documentação gerada  
✔ Code Review concluído  
✔ Instance Scan executado  

---

## 🧠 Conceito
```
CAB
        ↓
UI Action - Gerar Documentação
        ↓
Central de Documentação Técnica
        ↓
[ Documentação | Code Review | Instance Scan ]
        ↓
Validações
        ↓
Status = Concluído
```

---

## 🏗 Arquitetura

A solução utiliza recursos nativos + customizações avançadas do ServiceNow:

### Backend
- Script Includes
- GlideRecord
- GlideAjax
- Regras de Negócio
- ACLs
- Relacionamentos N:N

### Frontend
- UI Actions
- UI Macros
- Formatters
- HTML dinâmico

---

## 🗃 Modelo de Dados

### Tabelas principais

| Tabela | Responsabilidade |
|-------------------------------|-------------------------------|
| u_central_documentacao_tecnica | Registro pai do processo |
| u_code_review | Controle de review por Update Set |
| u_code_review_artifact | Artefatos avaliados |
| u_m2m_central_documentacao_update_set | Relacionamento N:N |

---

## ⚙ Funcionalidades

### 📄 Documentação Técnica
- Geração automática de HTML
- Consolida informações dos Update Sets
- Anexos e evidências

### 🔍 Code Review
- Review por Update Set
- Lista de artefatos alterados
- Avaliação item a item
- Status obrigatório

### 🧪 Instance Scan
- Consulta de resultados técnicos
- Validação de qualidade
- Evidência de conformidade

### 🚫 Regras de Governança
- 1 documentação por CAB
- Todos os Update Sets obrigatórios
- Não permite finalizar com pendências
- Bloqueio de edição após conclusão

---

## 🧩 Componentes criados

### UI
- UI Actions
- UI Macros
- Formatters
- Seções customizadas de formulário

### Server
- Script Includes
- Validações de negócio
- Processamento assíncrono (GlideAjax)

### Segurança
- ACLs de leitura/escrita
- Bloqueio pós-conclusão

