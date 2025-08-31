package org.core.rest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Disabled
@WebMvcTest({UserController.class})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void getUserByUserId() throws Exception {
        mockMvc.perform(get("/api/v1/users/{0}", "1"))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @Test
    public void createUser() throws Exception {
        String createUserDTO = """
                {
                    "name": "Andrey",
                    "email": "atimonin2006@gmail.com",
                    "password": "password"
                }""";

        mockMvc.perform(post("/api/v1/users")
                        .content(createUserDTO)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @Test
    public void authenticateUser() throws Exception {
        String userLoginDTO = """
                {
                  "email": "atimonin2006@gmail.com",
                  "password": "password"
                }""";

        mockMvc.perform(post("/api/v1/users/login")
                        .content(userLoginDTO)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @Test
    public void updateUser() throws Exception {
        String updateUserDTO = """
                {
                  "userId": 1,
                  "name": "Andrey",
                  "email": "atimonin2006@gmail.com",
                  "password": "password"
                }""";

        mockMvc.perform(put("/api/v1/users/update")
                        .content(updateUserDTO)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @Test
    public void deleteUser() throws Exception {
        mockMvc.perform(delete("/api/v1/users/delete/{0}", "1"))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @BeforeEach
    public void setup() {

    }
}
