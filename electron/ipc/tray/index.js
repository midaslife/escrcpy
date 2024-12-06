import { trayPath } from '$electron/configs/index.js'
import { executeI18n } from '$electron/helpers/index.js'
import appStore from '$electron/helpers/store.js'
import { app, dialog, Menu, Tray } from 'electron'

export default (mainWindow) => {
  const t = value => executeI18n(mainWindow, value)

  let tray = null

  const showApp = () => {
    if (process.platform === 'darwin') {
      app.dock.show()
    }

    mainWindow.show()

    if (tray) {
      tray.destroy()
      tray = null
    }

    return true
  }

  const hideApp = () => {
    if (process.platform === 'darwin') {
      app.dock.hide()
    }

    mainWindow.hide()

    return true
  }

  const quitApp = () => {
    app.isQuiting = true

    app.quit()

    return true
  }

  const closeApp = async (response) => {
    if (response === 0) {
      quitApp()
      return true
    }
    else if (response === 1) {
      hideApp()

      tray = new Tray(trayPath)

      tray.setToolTip('escrcpy')

      tray.on('click', () => {
        showApp()
      })

      const contextMenu = Menu.buildFromTemplate([
        {
          label: await t('common.open'),
          click: () => {
            showApp()
          },
        },
        {
          label: await t('common.restart'),
          click: () => {
            app.relaunch()
            quitApp()
          },
        },
        {
          label: await t('appClose.quit'),
          click: () => {
            quitApp()
          },
        },
      ])

      tray.setContextMenu(contextMenu)

      return true
    }

    return false
  }

  mainWindow.on('close', async (event) => {
    if (app.isQuiting) {
      mainWindow = null
      return true
    }

    event.preventDefault()

    let appCloseCode = appStore.get('common.appCloseCode')

    if (![0, 1].includes(appCloseCode)) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: [
          await t('appClose.quit'),
          await t('appClose.minimize'),
          await t('appClose.quit.cancel'),
        ],
        title: await t('common.tips'),
        message: await t('appClose.message'),
      })

      appCloseCode = response
    }

    closeApp(appCloseCode)
  })
}
