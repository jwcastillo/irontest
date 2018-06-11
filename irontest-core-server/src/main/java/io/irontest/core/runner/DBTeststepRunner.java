package io.irontest.core.runner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import io.irontest.models.OracleTIMESTAMPTZSerializer;
import io.irontest.models.endpoint.Endpoint;
import io.irontest.models.teststep.Teststep;
import io.irontest.utils.IronTestUtils;
import org.skife.jdbi.v2.*;
import org.skife.jdbi.v2.tweak.BaseStatementCustomizer;

import java.sql.PreparedStatement;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DBTeststepRunner extends TeststepRunner {
    private static ObjectMapper jacksonObjectMapper = new ObjectMapper();

    static {
        jacksonObjectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss"));

        //  settings for Oracle
        //  for ResultSet.getObject to return java.sql.Timestamp instead of oracle.sql.TIMESTAMP which Jackson does not know how to serialize.
        System.getProperties().setProperty("oracle.jdbc.J2EE13Compliant", "true");
        //  register custom JSON serializer for Oracle TIMESTAMPTZ class
        try {
            Class clazz = Class.forName("oracle.sql.TIMESTAMPTZ");
            SimpleModule module = new SimpleModule("OracleModule");
            module.addSerializer(clazz, new OracleTIMESTAMPTZSerializer(clazz));
            jacksonObjectMapper.registerModule(module);
        } catch (ClassNotFoundException e) {
            //  do nothing if the TIMESTAMPTZ class does not exist
        }
    }

    protected BasicTeststepRun run(Teststep teststep) throws Exception {
        BasicTeststepRun basicTeststepRun = new BasicTeststepRun();
        DBAPIResponse response = new DBAPIResponse();
        String request = (String) teststep.getRequest();
        Endpoint endpoint = teststep.getEndpoint();
        DBI jdbi = new DBI(endpoint.getUrl(), endpoint.getUsername(), getDecryptedEndpointPassword());

        //  get SQL statements (trimmed and without comments) and JDBI script object
        List<String> statements = IronTestUtils.getStatements(request);
        sanityCheckTheStatements(statements);

        Handle handle = jdbi.open();
        if (SQLStatementType.isSelectStatement(statements.get(0))) {    //  the request is a select statement
            RetainingColumnOrderResultSetMapper resultSetMapper = new RetainingColumnOrderResultSetMapper();
            //  use statements.get(0) instead of the raw request, as Oracle does not support trailing semicolon in select statement
            Query<Map<String, Object>> query = handle.createQuery(statements.get(0)).map(resultSetMapper);
            //  obtain columnNames in case the query returns no row
            final List<String> columnNames = new ArrayList<String>();
            query.addStatementCustomizer(new BaseStatementCustomizer() {
                public void afterExecution(PreparedStatement stmt, StatementContext ctx) throws SQLException {
                    ResultSetMetaData metaData = stmt.getMetaData();
                    for (int i = 1; i <= metaData.getColumnCount(); i++) {
                        columnNames.add(metaData.getColumnLabel(i).toLowerCase());
                    }
                }
            });
            List<Map<String, Object>> rows = query.list(5000);    //  limit the number of returned rows
            response.setColumnNames(columnNames);
            response.setRowsJSON(jacksonObjectMapper.writeValueAsString(rows));
        } else {                                          //  the request is one or more non-select statements
            Script script = handle.createScript(request);
            int[] returnValues = script.execute();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < returnValues.length; i++) {
                String statementType = SQLStatementType.getByStatement(statements.get(i)).toString();
                sb.append(returnValues[i]).append(" row(s) ").append(statementType.toLowerCase())
                    .append(statementType.endsWith("E") ? "d" : "ed").append("\n");
                response.setStatementExecutionResults(sb.toString());
            }
        }

        handle.close();

        basicTeststepRun.setResponse(response);
        return basicTeststepRun;
    }

    /**
     * Throw exception if the statements are not supported.
     * @param statements
     * @throws Exception
     */
    private void sanityCheckTheStatements(List<String> statements) throws Exception {
        if (statements.size() == 0) {
            throw new Exception("No SQL statement to run.");
        }

        int selectStatementCount = 0;
        boolean nonSelectStatementExists = false;
        for (String statement: statements) {
            if (!(SQLStatementType.isSelectStatement(statement) ||
                    SQLStatementType.isInsertStatement(statement) ||
                    SQLStatementType.isUpdateStatement(statement) ||
                    SQLStatementType.isDeleteStatement(statement))) {
                throw new Exception("Only " + SQLStatementType.SELECT + ", " + SQLStatementType.INSERT + ", " +
                        SQLStatementType.UPDATE + " and " + SQLStatementType.DELETE + " statements are supported.");
            }
            if (SQLStatementType.isSelectStatement(statement)) {
                selectStatementCount++;
            } else {
                nonSelectStatementExists = true;
            }
        }
        if (selectStatementCount > 1) {
            throw new Exception("At most one " + SQLStatementType.SELECT + " statement is supported.");
        }
        if (selectStatementCount == 1 && nonSelectStatementExists) {
            throw new Exception("Mixture of " + SQLStatementType.SELECT + " and non-" + SQLStatementType.SELECT + " statements are not supported.");
        }
    }
}
