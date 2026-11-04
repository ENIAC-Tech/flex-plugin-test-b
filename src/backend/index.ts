import { buildDefaultAppearance, titleIconPresentationV1 } from '@flexsdk/runtime';
import { FlexPluginBase } from '@flexsdk/runtime';
import type { PluginDefinitionsPayload, PluginEventEnvelope, PluginLoadContext } from '@flexsdk/types';

const PLUGIN_UUID = '@ENIAC-Tech/flex-plugin-test-b';
const PLUGIN_C_UUID = '@ENIAC-Tech/flex-plugin-test-c';
const UNIT_TYPE_ID = `${PLUGIN_UUID}.example-unit`;

export default class FlexPluginTestBPlugin extends FlexPluginBase {
  async getDefinitions(): Promise<PluginDefinitionsPayload> {
    return {
      libraries: [this.createDefaultLibrary({ name: 'Flex Plugin Test B' })],
      units: [
        this.createUnitTemplate({
          unitId: 'example-unit',
          typeId: UNIT_TYPE_ID,
          name: 'Example Unit',
          categoryId: 'plugin',
          icon: 'mdi-puzzle',
          requirements: { deviceCapabilities: [] },
          presentation: titleIconPresentationV1({ textId: 'c107c69e', iconId: 'de833d24', colorIds: ['c107c69e', 'de833d24'], fonts: ['c107c69e'], elementTypes: ['text', 'icon', 'image'], functionEditors: [{ kind: 'plugin', pluginUUID: PLUGIN_UUID, typeId: UNIT_TYPE_ID, scope: 'unit' }], commonSettings: ['activation', 'wireless'], surface: 'captured-unit', theme: { mode: 'generic', userThemes: 'editable' } }),
          layouts: { default: { preferredSize: { width: 1, height: 1 }, appearance: buildDefaultAppearance('mdi-puzzle', 'Example Unit') } },
          hasView: false,
          defaultData: { message: 'Hello from plugin!' }
        })
      ],
      revision: '1.0.0'
    };
  }

  async onLoad(ctx: PluginLoadContext): Promise<void> {
    await super.onLoad(ctx);
    this.logger.info('Plugin loaded');

    this.registerDependencyApi('getDependencyApiProbe', async (input?: string) => {
      const probeInput = input ?? 'from-b';
      const dependency = await ctx.hostApi.plugin.callDependency(
        PLUGIN_C_UUID,
        'getDependencyApiProbe',
        [probeInput]
      );

      return {
        plugin: 'b',
        input: probeInput,
        dependency,
        message: 'hello-from-b'
      };
    });

    this.registerRendererRpc('getMessage', async () => {
      return ctx.hostApi.store.get('message', 'Hello from plugin!');
    });

    this.registerRendererRpc('setMessage', async (message: string) => {
      await ctx.hostApi.store.set('message', message);
      return { success: true };
    });

    await this.onRawUnitEvent(UNIT_TYPE_ID, async (payload) => {
      if (payload.rawEvent !== 'pressed') return;
      this.logger.info('Key pressed', { payload });
    });

    await this.on(
      'device.connection.changed',
      (event: PluginEventEnvelope) => {
        this.logger.info('Device connection changed', event.payload);
      },
      { snapshot: true }
    );
  }
}
