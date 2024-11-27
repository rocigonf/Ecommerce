﻿using Ecommerce.Models.Database.Entities;
using Ecommerce.Services;
using Microsoft.AspNetCore.Mvc;
using Ecommerce.Models.Dtos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Ecommerce.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemporalOrderController : ControllerBase
{
    private readonly TemporalOrderService _temporalOrderService;

    public TemporalOrderController(TemporalOrderService temporalOrderService)
    {
        _temporalOrderService = temporalOrderService;
    }


    // obtener por id la orden temporal DTO
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemporalOrderById(int id)
    {
        try
        {
            var temporalOrder = await _temporalOrderService.GetDtoByIdAsync(id);

            if (temporalOrder == null)
            {
                return null;
            }

            return Ok(temporalOrder);
        }
        catch (Exception)
        {
            return StatusCode(500, "Error al buscar la orden temporal.");
        }
    }



    // obtener por id la orden temporal SIN DTO
    [HttpGet("temporal/{id}")]
    public async Task<IActionResult> GetTemporalOrderByIdNoDto(int id)
    {
        try
        {
            var temporalOrder = await _temporalOrderService.GetByIdAsync(id);

            if (temporalOrder == null)
            {
                return null;
            }

            return Ok(temporalOrder);
        }
        catch (Exception)
        {
            return StatusCode(500, "Error al buscar la orden temporal.");
        }
    }


    // hay que hacer dos metodos , uno si esta loguqeado (q recibe el jwt) y otro si no lo esta que recibe el carrito del localstorage

    // si lo recibe del front: recibe un array de productCart y el metodo de pago

    // DESDE EL LOCAL

    [HttpPost("newTemporalOrderLocal")]
    public async Task<ActionResult<TemporalOrder>> NewTemporalOrderLocal([FromBody] ProductCartDto[] cart, string paymentMethod)
    {
        try
        {
            var newTemporalOrder = await _temporalOrderService.CreateTemporalOrderLocalAsync(cart, paymentMethod);

            return Ok(newTemporalOrder);

        }
        catch (InvalidOperationException e)
        {
            return Conflict($"No pudo crearse la order temporal: {e.Message}");
        }
        
    }


    // DESDE LA BBDD
    [HttpPost("newTemporalOrderBBDD")]
    public async Task<ActionResult<TemporalOrder>> NewTemporalOrderBBDD([FromBody] CartDto cart, string paymentMethod)
    {
        try
        {
            var newTemporalOrder = await _temporalOrderService.CreateTemporalOrderBBDDAsync(cart, paymentMethod);

            return Ok(newTemporalOrder);

        }
        catch (InvalidOperationException e)
        {
            return Conflict($"No pudo crearse la order temporal: {e.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error interno: {ex.Message}");
        }
    }



    [HttpGet("refresh-order")]
    public async Task<ActionResult> RefreshOrder([FromQuery]int temporalOrderId)
    {
        TemporalOrder temporalOrder = await _temporalOrderService.GetOrderByIdAsync(temporalOrderId);
        if (temporalOrder == null)
        {
            Console.WriteLine("La orden temporal es nula");
            return null;
        }

        temporalOrder.ExpiresAt = DateTime.UtcNow.AddMinutes(5); // La orden temporal expira en 5 minutos (la borra el servicio en segundo plano)
        TemporalOrder newTemporalOrder = await _temporalOrderService.UpdateOrder(temporalOrder);

        return Ok(newTemporalOrder);
    }
}



