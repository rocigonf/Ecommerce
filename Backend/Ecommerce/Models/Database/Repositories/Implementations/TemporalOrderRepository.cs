﻿using Ecommerce.Models.Database.Entities;
using Ecommerce.Models.Dtos;
using Ecommerce.Models.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Models.Database.Repositories.Implementations;

public class TemporalOrderRepository : Repository<TemporalOrder, int>
{
    private readonly TemporalOrderMapper _temporalOrderMapper;


    public TemporalOrderRepository(EcommerceContext context) : base(context)
    {
        _temporalOrderMapper = new TemporalOrderMapper();
    }


    // obtener orden temporal segun id
    public async Task<TemporalOrderDto> GetTemporalCartById(int id)
    {
        var temporalOrder = await GetQueryable()
            .Include(t => t.TemporalProductOrder)
            .ThenInclude(p => p.Product)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (temporalOrder == null)
        {
            Console.WriteLine($"No se encontró orden temporal con esta id: {id}."); 
            throw new InvalidOperationException("La orden temporal no se encontró para esta id.");
        }

        return _temporalOrderMapper.TemporalOrderToDto(temporalOrder);
    }

    


    // Crear una orden temporal DESDE EL LOCAL
    public async Task<TemporalOrder> InsertTemporalOrderLocalAsync(ProductCartDto[] cart)
    {

    // precio total
    var total = cart.Sum(pc => pc.Quantity * pc.Product.Price);

        
        var newTemporalOrder = new TemporalOrder
        {
            UserId = null,
            PaymentMethod = "",
            TotalPrice = total,
            // pasamos los productos del carrito a la orden
            TemporalProductOrder = cart.Select(pc => new TemporalProductOrder
            {
                Quantity = pc.Quantity,
                ProductId = pc.Product.Id,
                Product = null // lo tendre que definir despues
            }).ToList(),
            User = null, 
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // expira en 15 minutos
        };

        var insertedTemporalOrder = await InsertAsync(newTemporalOrder);

        if (insertedTemporalOrder == null)
        {
            throw new Exception("No se pudo crear la orden temporal.");
        }


        if (!await SaveAsync())
        {
            throw new Exception("La orden temporal no se pudo guardar el la BBDD.");

        }

        return newTemporalOrder;
    }


    // Crear una orden temporal DESDE LA BASE DE DATOS
    public async Task<TemporalOrder> InsertTemporalOrderBBDDAsync(CartDto cart, String paymentMethod)
    {
        // precio total
        var total = cart.ProductCarts.Sum(pc => pc.Quantity * pc.Product.Price);

        var newTemporalOrder = new TemporalOrder
        {
            UserId = cart.UserId,
            PaymentMethod = paymentMethod,
            TotalPrice = total,
            // pasamos los productos del carrito a la orden
            TemporalProductOrder = cart.ProductCarts.Select(pc => new TemporalProductOrder
            {
                Quantity = pc.Quantity,
                ProductId = pc.Product.Id,
                Product = null
            }).ToList(),
            User = null, //  recibo un dto, habria que asignarlo dsede el token !!

            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // expira en 15 minutos
        };

        var insertedTemporalOrder = await InsertAsync(newTemporalOrder);

        if (insertedTemporalOrder == null)
        {
            throw new Exception("No se pudo crear la orden temporal.");
        }


        if (!await SaveAsync())
        {
            throw new Exception("La orden temporal no se pudo guardar el la BBDD.");

        }

        return newTemporalOrder;
    }

}

