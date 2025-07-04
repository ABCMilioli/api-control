import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast.js';
import { useState, useEffect } from 'react';
import { toast } from './use-toast.js';
import { Client } from '../types/index.js';
import { api } from '../lib/api.js'; // Corrigido para usar extensão .js

// Funções para consumir a API REST
const API_URL = '/clients';

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get(API_URL);
      if (!res.ok) throw new Error('Erro ao buscar clientes');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar cliente');
      return res.json();
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newClient: any) => {
      const res = await api.post(API_URL, newClient);
      if (!res.ok) throw new Error('Erro ao criar cliente');
      const createdClient = await res.json();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente criado',
        description: `${createdClient.name} foi adicionado com sucesso`,
      });
      return createdClient;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updatedClient: any) => {
      const res = await api.put(`${API_URL}/${updatedClient.id}`, updatedClient);
      if (!res.ok) throw new Error('Erro ao atualizar cliente');
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', updated.id] });
      toast({
        title: 'Cliente atualizado',
        description: `${updated.name} foi atualizado com sucesso`,
      });
      return updated;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`${API_URL}/${id}`);
      if (!res.ok) throw new Error('Erro ao remover cliente');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi removido com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    },
  });
};

export const useSearchClients = (searchTerm: string) => {
  return useQuery({
    queryKey: ['clients', 'search', searchTerm],
    queryFn: async () => {
      const res = await api.get(`${API_URL}?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('Erro ao buscar clientes');
      return res.json();
    },
    enabled: searchTerm.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useClientStatusCounts = () => {
  return useQuery({
    queryKey: ['clients', 'status-counts'],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/status-counts`);
      if (!res.ok) throw new Error('Erro ao buscar status dos clientes');
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
