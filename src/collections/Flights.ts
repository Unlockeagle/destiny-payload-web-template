import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  FixedToolbarFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  HeadingFeature,
  OrderedListFeature,
  BlockquoteFeature,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

export const Flights: CollectionConfig = {
  slug: 'flights',
  // 👇 esto activa los borradores
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'flight',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },

  fields: [
    {
      type: 'tabs',

      tabs: [
        {
          label: 'Card',
          fields: [
            {
              name: 'isFeatured',
              label: '⭐ Destacado en Home',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Mostrar en el carousel más vendidos',
              },
            },
            {
              name: 'flight',
              label: 'Destino del Vuelo',
              type: 'text',
              required: true,
              admin: { description: 'Ej: Madrid, Firenze, Los Roques...' },
            },
            {
              name: 'description',
              label: 'Descripción',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Descripción corta, min. 100 - max. 150 caracteres',
              },
            },
            {
              name: 'country',
              label: 'País del destino',
              type: 'text',
              required: true,
              admin: { description: 'Ej: España, Italia, Argentina...' },
            },
            {
              name: 'category',
              label: 'Categoría',
              type: 'relationship',
              relationTo: 'categories',
            },
            {
              name: 'origin',
              label: 'Ciudad de Origen',
              type: 'text',
              required: true,
              admin: { description: 'Ej: Caracas (De donde sale el vuelo)' },
            },
            {
              name: 'price',
              label: 'Precio $',
              type: 'number',
              required: true,
              admin: {
                description: 'Ej: 1500 (sin símbolos ni puntos)',
              },
            },
            { name: 'hasDiscount', label: 'Descuento', type: 'checkbox', defaultValue: false },
            {
              name: 'discountPrice',
              label: 'Precio con descuento $',
              type: 'number',
              admin: {
                condition: (data) => data?.hasDiscount === true,
                description: 'Precio final después del descuento',
              },
              hooks: {
                beforeChange: [
                  ({ siblingData, value }) => {
                    if (!siblingData.hasDiscount) return 0
                    return value
                  },
                ],
              },
            },

            {
              name: 'cover_image',
              label: 'Imagen Principal',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Imagen Principal del vuelo' },
            },
          ],
        },
        {
          label: 'Contenido',
          fields: [
            {
              name: 'longDescription',
              label: 'Descripción Larga',
              type: 'richText',
              editor: lexicalEditor({
                features: () => [
                  FixedToolbarFeature(), // 👈 barra fija superior
                  InlineToolbarFeature(), // 👈 barra flotante al seleccionar
                  BoldFeature(),
                  ItalicFeature(),
                  UnderlineFeature(),
                  HeadingFeature({
                    enabledHeadingSizes: ['h2', 'h3', 'h4'], // h1 no — ya es el título de la página
                  }),

                  OrderedListFeature(),
                  BlockquoteFeature(),
                  LinkFeature(),
                  UploadFeature({
                    collections: {
                      media: {
                        fields: [
                          {
                            name: 'alt',
                            type: 'text',
                            label: 'Texto alternativo',
                            required: true,
                          },
                          {
                            name: 'caption',
                            type: 'text',
                            label: 'Pie de foto',
                          },
                        ],
                      },
                    },
                  }),
                ],
              }),
              admin: {
                description: 'Mínimo 300 palabras para SEO.',
              },
            },
            {
              name: 'highlights',
              label: 'Puntos Destacados',
              type: 'array',
              admin: {
                description: 'Ej: Vuelo directo, Sin escalas, Equipaje incluido',
              },
              fields: [
                {
                  name: 'item',
                  label: 'Punto',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'faqs',
              label: 'Preguntas Frecuentes',
              type: 'array',
              admin: {
                description: 'Genera rich snippets en Google — muy importante para SEO',
              },
              fields: [
                {
                  name: 'question',
                  label: 'Pregunta',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'answer',
                  label: 'Respuesta',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },

        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title', // ← corregir si era 'meta.flight'
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({
              hasGenerateFn: true, // ← AÑADIR ESTO
            }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title', // ← corregir si era 'meta.flight'
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
