
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from '../hooks/use-toast';
import { Copy, CreditCard, DollarSign, Link, Settings, Zap } from 'lucide-react';

export default function PaymentSettings() {
  const [stripeSettings, setStripeSettings] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    enabled: false
  });

  const [paypalSettings, setPaypalSettings] = useState({
    clientId: '',
    clientSecret: '',
    sandboxMode: true,
    enabled: false
  });

  const [mercadoPagoSettings, setMercadoPagoSettings] = useState({
    accessToken: '',
    publicKey: '',
    sandboxMode: true,
    enabled: false
  });

  const [planSettings, setPlanSettings] = useState({
    basicPlan: {
      name: 'Plano Básico',
      description: 'Acesso básico ao sistema',
      price: '29.90',
      currency: 'BRL',
      interval: 'monthly'
    },
    proPlan: {
      name: 'Plano Pro',
      description: 'Acesso completo com recursos avançados',
      price: '59.90',
      currency: 'BRL',
      interval: 'monthly'
    },
    enterprisePlan: {
      name: 'Plano Enterprise',
      description: 'Solução corporativa completa',
      price: '199.90',
      currency: 'BRL',
      interval: 'monthly'
    }
  });

  const [oneTimeProducts, setOneTimeProducts] = useState({
    setupFee: {
      name: 'Taxa de Configuração',
      description: 'Taxa única de configuração do sistema',
      price: '99.00',
      currency: 'BRL'
    },
    customization: {
      name: 'Personalização',
      description: 'Personalização do sistema',
      price: '299.00',
      currency: 'BRL'
    }
  });

  const [checkoutSettings, setCheckoutSettings] = useState({
    successUrl: window.location.origin + '/payment-success',
    cancelUrl: window.location.origin + '/payment-cancel',
    collectBillingAddress: true,
    allowPromotionCodes: true,
    termsOfServiceUrl: '',
    privacyPolicyUrl: ''
  });

  const generateCheckoutLink = (type: 'subscription' | 'one-time', planKey?: string) => {
    const baseUrl = 'https://checkout.stripe.com/pay/';
    let link = '';
    
    if (type === 'subscription' && planKey) {
      const plan = planSettings[planKey as keyof typeof planSettings];
      link = `${baseUrl}subscription#plan=${planKey}&price=${plan.price}&currency=${plan.currency}&interval=${plan.interval}`;
    } else if (type === 'one-time' && planKey) {
      const product = oneTimeProducts[planKey as keyof typeof oneTimeProducts];
      link = `${baseUrl}payment#product=${planKey}&price=${product.price}&currency=${product.currency}`;
    }
    
    return link;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "O link do checkout foi copiado para a área de transferência."
    });
  };

  const saveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações de pagamento foram salvas com sucesso."
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações de Pagamento</h1>
      </div>

      <Tabs defaultValue="gateways" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
        </TabsList>

        {/* Gateways de Pagamento */}
        <TabsContent value="gateways" className="space-y-6">
          {/* Stripe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe
                </CardTitle>
                <Switch
                  checked={stripeSettings.enabled}
                  onCheckedChange={(checked) => 
                    setStripeSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stripe-publishable">Chave Pública</Label>
                  <Input
                    id="stripe-publishable"
                    value={stripeSettings.publishableKey}
                    onChange={(e) => setStripeSettings(prev => ({ 
                      ...prev, 
                      publishableKey: e.target.value 
                    }))}
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor="stripe-secret">Chave Secreta</Label>
                  <Input
                    id="stripe-secret"
                    type="password"
                    value={stripeSettings.secretKey}
                    onChange={(e) => setStripeSettings(prev => ({ 
                      ...prev, 
                      secretKey: e.target.value 
                    }))}
                    placeholder="sk_test_..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                <Input
                  id="stripe-webhook"
                  type="password"
                  value={stripeSettings.webhookSecret}
                  onChange={(e) => setStripeSettings(prev => ({ 
                    ...prev, 
                    webhookSecret: e.target.value 
                  }))}
                  placeholder="whsec_..."
                />
              </div>
            </CardContent>
          </Card>

          {/* PayPal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  PayPal
                </CardTitle>
                <Switch
                  checked={paypalSettings.enabled}
                  onCheckedChange={(checked) => 
                    setPaypalSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paypal-client-id">Client ID</Label>
                  <Input
                    id="paypal-client-id"
                    value={paypalSettings.clientId}
                    onChange={(e) => setPaypalSettings(prev => ({ 
                      ...prev, 
                      clientId: e.target.value 
                    }))}
                    placeholder="Client ID do PayPal"
                  />
                </div>
                <div>
                  <Label htmlFor="paypal-secret">Client Secret</Label>
                  <Input
                    id="paypal-secret"
                    type="password"
                    value={paypalSettings.clientSecret}
                    onChange={(e) => setPaypalSettings(prev => ({ 
                      ...prev, 
                      clientSecret: e.target.value 
                    }))}
                    placeholder="Client Secret do PayPal"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="paypal-sandbox"
                  checked={paypalSettings.sandboxMode}
                  onCheckedChange={(checked) => 
                    setPaypalSettings(prev => ({ ...prev, sandboxMode: checked }))
                  }
                />
                <Label htmlFor="paypal-sandbox">Modo Sandbox</Label>
              </div>
            </CardContent>
          </Card>

          {/* Mercado Pago */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Mercado Pago
                </CardTitle>
                <Switch
                  checked={mercadoPagoSettings.enabled}
                  onCheckedChange={(checked) => 
                    setMercadoPagoSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mp-access-token">Access Token</Label>
                  <Input
                    id="mp-access-token"
                    type="password"
                    value={mercadoPagoSettings.accessToken}
                    onChange={(e) => setMercadoPagoSettings(prev => ({ 
                      ...prev, 
                      accessToken: e.target.value 
                    }))}
                    placeholder="Access Token do Mercado Pago"
                  />
                </div>
                <div>
                  <Label htmlFor="mp-public-key">Public Key</Label>
                  <Input
                    id="mp-public-key"
                    value={mercadoPagoSettings.publicKey}
                    onChange={(e) => setMercadoPagoSettings(prev => ({ 
                      ...prev, 
                      publicKey: e.target.value 
                    }))}
                    placeholder="Public Key do Mercado Pago"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="mp-sandbox"
                  checked={mercadoPagoSettings.sandboxMode}
                  onCheckedChange={(checked) => 
                    setMercadoPagoSettings(prev => ({ ...prev, sandboxMode: checked }))
                  }
                />
                <Label htmlFor="mp-sandbox">Modo Sandbox</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planos Recorrentes */}
        <TabsContent value="plans" className="space-y-6">
          {Object.entries(planSettings).map(([key, plan]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Plano</Label>
                    <Input
                      value={plan.name}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Preço</Label>
                    <Input
                      value={plan.price}
                      onChange={(e) => setPlanSettings(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], price: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={plan.description}
                    onChange={(e) => setPlanSettings(prev => ({
                      ...prev,
                      [key]: { ...prev[key as keyof typeof prev], description: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Moeda</Label>
                    <RadioGroup
                      value={plan.currency}
                      onValueChange={(value) => setPlanSettings(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], currency: value }
                      }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="BRL" id={`${key}-brl`} />
                        <Label htmlFor={`${key}-brl`}>BRL (R$)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="USD" id={`${key}-usd`} />
                        <Label htmlFor={`${key}-usd`}>USD ($)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label>Intervalo</Label>
                    <RadioGroup
                      value={plan.interval}
                      onValueChange={(value) => setPlanSettings(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], interval: value }
                      }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id={`${key}-monthly`} />
                        <Label htmlFor={`${key}-monthly`}>Mensal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yearly" id={`${key}-yearly`} />
                        <Label htmlFor={`${key}-yearly`}>Anual</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Link className="h-4 w-4" />
                  <code className="flex-1 text-sm">{generateCheckoutLink('subscription', key)}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generateCheckoutLink('subscription', key))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Produtos/Pagamentos Únicos */}
        <TabsContent value="products" className="space-y-6">
          {Object.entries(oneTimeProducts).map(([key, product]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Produto</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => setOneTimeProducts(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Preço</Label>
                    <Input
                      value={product.price}
                      onChange={(e) => setOneTimeProducts(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], price: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) => setOneTimeProducts(prev => ({
                      ...prev,
                      [key]: { ...prev[key as keyof typeof prev], description: e.target.value }
                    }))}
                  />
                </div>

                <div>
                  <Label>Moeda</Label>
                  <RadioGroup
                    value={product.currency}
                    onValueChange={(value) => setOneTimeProducts(prev => ({
                      ...prev,
                      [key]: { ...prev[key as keyof typeof prev], currency: value }
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BRL" id={`${key}-product-brl`} />
                      <Label htmlFor={`${key}-product-brl`}>BRL (R$)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id={`${key}-product-usd`} />
                      <Label htmlFor={`${key}-product-usd`}>USD ($)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Link className="h-4 w-4" />
                  <code className="flex-1 text-sm">{generateCheckoutLink('one-time', key)}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generateCheckoutLink('one-time', key))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Configurações do Checkout */}
        <TabsContent value="checkout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="success-url">URL de Sucesso</Label>
                  <Input
                    id="success-url"
                    value={checkoutSettings.successUrl}
                    onChange={(e) => setCheckoutSettings(prev => ({ 
                      ...prev, 
                      successUrl: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cancel-url">URL de Cancelamento</Label>
                  <Input
                    id="cancel-url"
                    value={checkoutSettings.cancelUrl}
                    onChange={(e) => setCheckoutSettings(prev => ({ 
                      ...prev, 
                      cancelUrl: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="terms-url">URL dos Termos de Serviço</Label>
                  <Input
                    id="terms-url"
                    value={checkoutSettings.termsOfServiceUrl}
                    onChange={(e) => setCheckoutSettings(prev => ({ 
                      ...prev, 
                      termsOfServiceUrl: e.target.value 
                    }))}
                    placeholder="https://exemplo.com/termos"
                  />
                </div>
                <div>
                  <Label htmlFor="privacy-url">URL da Política de Privacidade</Label>
                  <Input
                    id="privacy-url"
                    value={checkoutSettings.privacyPolicyUrl}
                    onChange={(e) => setCheckoutSettings(prev => ({ 
                      ...prev, 
                      privacyPolicyUrl: e.target.value 
                    }))}
                    placeholder="https://exemplo.com/privacidade"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="collect-billing"
                    checked={checkoutSettings.collectBillingAddress}
                    onCheckedChange={(checked) => 
                      setCheckoutSettings(prev => ({ ...prev, collectBillingAddress: checked }))
                    }
                  />
                  <Label htmlFor="collect-billing">Coletar endereço de cobrança</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-promo"
                    checked={checkoutSettings.allowPromotionCodes}
                    onCheckedChange={(checked) => 
                      setCheckoutSettings(prev => ({ ...prev, allowPromotionCodes: checked }))
                    }
                  />
                  <Label htmlFor="allow-promo">Permitir códigos promocionais</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg" className="px-6">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
