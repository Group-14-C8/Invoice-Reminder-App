using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InvoiceApp.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace InvoiceApp.Api.Services;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config) => _config = config;

    public string CreateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}