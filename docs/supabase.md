# PostgreSQL / Supabase para a alpha

Status: schema, migration SQL e adapter Prisma implementados. Nenhuma migration alpha foi executada contra banco real neste ambiente. Credenciais ainda não foram fornecidas; testes em memória não substituem esse gate.

Configure `DATABASE_URL` com a conexão de runtime e `DIRECT_URL` com a conexão adequada às migrations, conforme as opções de rede e pooler disponíveis no projeto Supabase. O navegador nunca recebe essas variáveis. Verifique SSL e credenciais no painel do projeto; não coloque senhas em arquivos versionados.

A migration `20260919000100_alpha_match` adiciona a tabela `AlphaMatch`, sem alterar ou apagar `Game`. Ela persiste lobby, participantes, configurações, snapshot autoritativo, status, versão e timestamps. A gravação usa `UPDATE ... WHERE id AND version`; validação confirma que metadados e snapshot correspondem. A coluna JSONB contém informações privadas e não deve ser exposta por uma API pública de leitura direta. Restrinja acesso ao papel usado pelo servidor; não conecte o frontend à tabela.

Antes da liberação, executar `npm run db:deploy` contra um banco alpha identificado, conferir migrations e realizar teste de criar, gravar, recriar serviço e reconectar. Depois, testar duas instâncias concorrentes contra o mesmo banco. Esses passos permanecem pendentes.

Rollback da aplicação deve preservar as tabelas e snapshots. Não execute `migrate reset` nem remova tabelas em ambiente público. Snapshots alpha são envelopes v4; clientes antigos não devem tentar convertê-los implicitamente em v3. Preserve o snapshot original ao migrar uma partida antiga.

## Gate automatizado de persistência

`npm run test:db` exige `ALPHA_TEST_DATABASE_URL`, apontando para um banco dedicado de testes com as migrations aplicadas. A variável é separada de `DATABASE_URL` para impedir o uso acidental do runtime público. Sem essa configuração, o comando falha explicitamente; não marca o teste como aprovado ou ignorado.

O cenário cria dois convidados, inicia uma partida, fecha a conexão Prisma, abre outra, compara o snapshot persistido, reconecta o mesmo assento e disputa duas gravações CAS. Ao terminar, remove somente a partida com o ID criado pelo próprio teste. Não executa migrations, reset nem truncate. Essa prova cobre recriação de conexões e serviços; reiniciar o processo implantado continua sendo uma verificação adicional de deploy.

Status de execução: pendente, sem banco de testes configurado.
