#导入库
import pygame,sys,time,random
#初始化
pygame.init()
#定义窗口大小和标题
h=800
w=1000
screen=pygame.display.set_mode((w,h))
pygame.display.set_caption("x0")
#导入素材
qyj=pygame.image.load("qyj.png")#玩家
zjw1=pygame.image.load("zjw1.png")#敌人
zjwxt1=pygame.image.load("zjwxt.png")#敌人血条（满血）
zjwxt2=pygame.image.load("zjwxt-1.png")#敌人血条（扣了1滴血）
zjwxt3=pygame.image.load("zjwxt-2.png")#敌人血条（扣了2滴血）
zjwxt4=pygame.image.load("zjwxt-3.png")#敌人血条（扣了3滴血）
zjwxt5=pygame.image.load("zjwxt-4.png")#敌人血条（扣了4滴血）
zjwxt6=pygame.image.load("zjwxt-5.png")#敌人血条（5滴血都扣完了）
qyjxt1=pygame.image.load("qyjxt.png")#玩家血条（满血）
qyjxt2=pygame.image.load("qyjxt-1.png")#玩家血条（扣了一滴血）
qyjxt3=pygame.image.load("qyjxt-2.png")#玩家血条（两滴血都扣完了）
jsjm=pygame.image.load("jsjm.png")#游戏结束界面
#敌人攻击
zj1=pygame.image.load("zj.png")
zj2=pygame.image.load("zj.png")
zj3=pygame.image.load("zj.png")
zj4=pygame.image.load("zj.png")
zj5=pygame.image.load("zj.png")
zj6=pygame.image.load("zj.png")
zj7=pygame.image.load("zj.png")
zj8=pygame.image.load("zj.png")
zj9=pygame.image.load("zj.png")
#变量
run=True
jsjm_x=-100000#结束界面横坐标
jsjm_y=-100000#结束界面纵坐标
playerxl=2#玩家血量
qyj_x=0#玩家横坐标
qyj_y=h-120#玩家纵坐标
zjw_x=w-110#敌人横坐标
zjw_y=h-220#敌人纵坐标
zj_x=-100#敌人攻击横坐标
zj_y=-100#敌人攻击纵坐标

zjwxt=zjwxt1

#游戏主循环
while True:
    #按键事件检测
    key_event=pygame.key.get_pressed()
    if (key_event[pygame.K_LEFT] or key_event[pygame.K_a]) and qyj_x>0:
        qyj_x -=2
    if (key_event[pygame.K_RIGHT] or key_event[pygame.K_d]) and qyj_x<w-60:
        qyj_x +=2
    for event in pygame.event.get():
        if event.type==pygame.QUIT:
            pygame.quit()
            sys.exit()
        if event.type==pygame.KEYDOWN:
            if (event.key==pygame.K_UP or event.key==pygame.K_w or event.key==pygame.K_SPACE) and qyj_y>0:
                qyj_y -=70
            if (event.key==pygame.K_DOWN or event.key==pygame.K_s) and qyj_y<h-120:
                qyj_y +=70
            if event.key==pygame.K_RETURN and jsjm_x==0:
                pygame.quit()
                sys.exit()
    #起义军血量检测
    if playerxl==2:
        qyjxt=qyjxt1
    elif playerxl==1:
        qyjxt=qyjxt2
    else:
        qyjxt=qyjxt3
    #游戏结束事件
    if (qyj_x>=zjw_x-60 and qyj_y>=zjw_y) or (qyj_y==zjw_y-120 and zjw_x+110>=qyj_x>=zjw_x-60):
        playerxl=0
        """
    if qyjxt==qyjxt3:
        jsjm_x,jsjm_y=0,0
        """
    #重力       
    if qyj_y<h-120:
        qyj_y +=1.0
    #绘制
    screen.fill((255,255,255))#设置背景为白色
    screen.blit(zjwxt,(250,10))
    screen.blit(zjw1,(zjw_x,zjw_y))
    screen.blit(qyj,(qyj_x,qyj_y))
    screen.blit(qyjxt,(qyj_x-20,qyj_y-15))
    screen.blit(jsjm,(jsjm_x,jsjm_y))
    screen.blit(zj1,(zj_x,zj_y))

    if qyjxt==qyjxt3:
        time.sleep(0.12)
        jsjm_x,jsjm_y=0,0
    
    pygame.display.update()
    
