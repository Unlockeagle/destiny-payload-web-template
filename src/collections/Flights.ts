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

export const Flights: CollectionConfig = {
  slug: 'flights',
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
          label: 'Contenido',
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
          label: 'Precios',
          fields: [
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
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.flight',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.flight',
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
