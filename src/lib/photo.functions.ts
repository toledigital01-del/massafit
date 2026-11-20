import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const itemSchema = z.object({name:z.string(),grams:z.number(),calories:z.number(),protein:z.number(),carbs:z.number(),fat:z.number()});
export type PhotoItem = z.infer<typeof itemSchema>;

export const analyzeFoodPhoto = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator(z.object({image:z.string().startsWith('data:image/').max(8_000_000)}))
  .handler(async ({data}) => {
    const { generateResponse, GatewayError } = await import('@lovable.dev/ai-gateway');
    try {
      const res = await generateResponse({
        model:'openai/gpt-6-astra',
        input:[{role:'user',content:[
          {type:'input_text',text:'Você é um nutricionista brasileiro. Identifique cada alimento visível na foto do prato (ou rótulo nutricional), estime a quantidade em gramas e calcule calorias, proteína, carboidrato e gordura da porção, usando referências da tabela TACO. Nomes em português do Brasil. Se não houver comida, retorne lista vazia. Responda em JSON.'},
          {type:'input_image',image_url:data.image,detail:'auto'},
        ]}],
        text:{format:{type:'json_schema',name:'refeicao',strict:true,schema:{type:'object',additionalProperties:false,required:['items'],properties:{items:{type:'array',items:{type:'object',additionalProperties:false,required:['name','grams','calories','protein','carbs','fat'],properties:{name:{type:'string'},grams:{type:'number'},calories:{type:'number'},protein:{type:'number'},carbs:{type:'number'},fat:{type:'number'}}}}}}}},
      });
      const text = res.output.flatMap(o => o.type==='message' ? o.content : []).map(c => c.type==='output_text' ? c.text : '').join('');
      const items = z.object({items:z.array(itemSchema)}).parse(JSON.parse(text)).items;
      return items.map(i => ({...i,grams:Math.round(i.grams),calories:Math.round(i.calories),protein:Math.round(i.protein*10)/10,carbs:Math.round(i.carbs*10)/10,fat:Math.round(i.fat*10)/10}));
    } catch (e) {
      if (e instanceof GatewayError) {
        if (e.httpStatus===429) throw new Error('Muitas análises seguidas. Aguarde um instante.');
        if (e.httpStatus===402) throw new Error('Créditos de IA esgotados no momento.');
      }
      console.error(e);
      throw new Error('Não foi possível analisar a foto. Tente outra imagem.');
    }
  });
