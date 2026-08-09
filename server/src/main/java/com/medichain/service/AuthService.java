package com.medichain.service;

import com.medichain.dto.AuthResponse;
import com.medichain.dto.LoginRequest;
import com.medichain.dto.RegisterRequest;
import com.medichain.exception.ApiError;
import com.medichain.model.User;
import com.medichain.repository.UserRepository;
import com.medichain.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ApiError(HttpStatus.CONFLICT, "A user with this email already exists");
        }

        User user = new User(
                request.getFullName(),
                request.getEmail().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser.getId());

        return new AuthResponse(savedUser, token);
    }

    public AuthResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiError(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = tokenProvider.generateToken(user.getId());
        return new AuthResponse(user, token);
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiError(HttpStatus.NOT_FOUND, "User not found"));
    }
}
