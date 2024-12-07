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
    public async Task<TemporalOrder> GetTemporalOrderById(int id)
    {
        var temporalOrder = await GetQueryable()
            .Include(t => t.User)
            .Include(t => t.TemporalProductOrder)
            .ThenInclude(p => p.Product)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (temporalOrder == null)
        {
            throw new InvalidOperationException("La orden temporal no se encontró para esta id.");
        }


        return temporalOrder;
    }



    // Crear una orden temporal DESDE EL LOCAL
    public async Task<TemporalOrder> InsertTemporalOrderLocalAsync(ProductCartDto[] cart, string paymentMethod)
    {

        // precio total
        var total = cart.Sum(pc => pc.Quantity * pc.Product.Price);


        var newTemporalOrder = new TemporalOrder
        {
            UserId = null,
            PaymentMethod = paymentMethod,
            TotalPrice = total,
            TemporalProductOrder = new List<TemporalProductOrder>(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // expira en 15 minutos
        };

        // generar el id de la orden temporal
        _context.TemporalOrder.Add(newTemporalOrder);
        await _context.SaveChangesAsync();

        // se asignan los productos
        foreach (var cartItem in cart)
        {
            var temporalProductOrder = new TemporalProductOrder
            {
                Quantity = cartItem.Quantity,
                ProductId = cartItem.Product.Id,
                TemporalOrderId = newTemporalOrder.Id // id generado
            };
            newTemporalOrder.TemporalProductOrder.Add(temporalProductOrder);
        }

        // actualizar la orden con los productos
        _context.TemporalOrder.Update(newTemporalOrder);
        await _context.SaveChangesAsync();

        return newTemporalOrder;
    }



    // Crear una orden temporal DESDE LA BASE DE DATOS
    public async Task<TemporalOrder> InsertTemporalOrderBBDDAsync(CartDto cart, String paymentMethod)
    {
        // precio total
        var total = cart.Products.Sum(pc => pc.Quantity * pc.Product.Price);

        var newTemporalOrder = new TemporalOrder
        {
            UserId = cart.UserId,
            PaymentMethod = paymentMethod,
            TotalPrice = total,
            // pasamos los productos del carrito a la orden
            TemporalProductOrder = cart.Products.Select(pc => new TemporalProductOrder
            {
                Quantity = pc.Quantity,
                ProductId = pc.Product.Id,
                Product = null // se asigna luego
            }).ToList(),
            User = null, //  recibo un dto, habria que asignarlo desde el token !!

            ExpiresAt = DateTime.UtcNow.AddMinutes(2) // expira en 2 minutos
        };

        var insertedTemporalOrder = await InsertAsync(newTemporalOrder);

        if (insertedTemporalOrder == null)
        {
            throw new Exception("No se pudo crear la orden temporal.");
        }

        return newTemporalOrder;
    }

}

