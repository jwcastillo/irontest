package io.irontest.db;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.irontest.models.User;
import io.irontest.utils.IronTestUtils;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;

/**
 * Created by Zheng on 24/12/2017.
 */
public class UserMapper implements ResultSetMapper<User> {
    @Override
    public User map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
        List<String> fields = IronTestUtils.getFieldsPresentInResultSet(rs);

        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setPassword(fields.contains("password") ? rs.getString("password") : null);
        user.setSalt(fields.contains("salt") ? rs.getString("salt") : null);
        if (fields.contains("roles") && rs.getString("roles") != null) {
            try {
                user.getRoles().addAll(new ObjectMapper().readValue(rs.getString("roles"), HashSet.class));
            } catch (IOException e) {
                throw new SQLException("Failed to deserialize roles JSON.", e);
            }
        }

        return user;
    }
}